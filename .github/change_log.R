library(httr)
library(jsonlite)
library(glue)

QMD_FILE <- "about/FIMS_CHANGELOG.qmd"
REPO <- "NOAA-FIMS/FIMS"
API_URL <- glue("https://api.github.com/repos/{REPO}/releases")

token <- Sys.getenv("GITHUB_PAT")

# read existing (or create minimal header)
x <- if (file.exists(QMD_FILE)) readLines(QMD_FILE, warn = FALSE, encoding = "UTF-8") else
  c("---", "title: FIMS Change Log", "---", "")

# where to insert: right after YAML front matter (--- ... ---)
delims <- which(trimws(x) == "---")
ins <- if (length(delims) >= 2 && delims[1] == 1) delims[2] else 0

# existing release-note URLs in file
existing_urls <- unique(sub(
  ".*\\[release notes\\]\\(([^)]+)\\).*", "\\1",
  grep("\\[release notes\\]\\(", x, value = TRUE),
  perl = TRUE
))

# fetch releases (newest-first)
resp <- GET(API_URL, add_headers(Authorization = paste("token", token)))
stop_for_status(resp)
rels <- fromJSON(content(resp, as = "text", encoding = "UTF-8"))

rels <- rels[!(rels$html_url %in% existing_urls), , drop = FALSE]
if (nrow(rels) == 0) quit(save = "no")

fmt_body <- function(s) {
  if (is.null(s) || !nzchar(s)) return("*No release notes available.*")
  s <- gsub("\r\n?", "\n", s)
  # Demote non-version H2 headings
  s <- gsub("(?m)^##(?!\\s*v\\d)\\s+", "### ", s, perl = TRUE)
  s <- gsub("(?m)^[ \t]*\\* ", "- ", s, perl = TRUE)
  s <- gsub(
    "(https://github\\.com/NOAA-FIMS/FIMS/(issues|pull)/(\\d+))",
    "[#\\3](\\1)",
    s, perl = TRUE
  )
  s <- sub("^\\n+", "", s)
  s <- sub("\\n+$", "", s)
  s <- gsub("\\n{3,}", "\n\n", s)
  s
}

# build new blocks (keeps newest-first order)
new_blocks <- unlist(lapply(seq_len(nrow(rels)), function(i) {
  r <- as.list(rels[i, ])
  c(
    glue("## {r$name} ([release notes]({r$html_url}))"),
    fmt_body(r$body),
    "", "---", ""
  )
}), use.names = FALSE)

# write back with new releases inserted at top (after YAML)
out <- c(x[1:ins], "", new_blocks, x[(ins + 1):length(x)])
writeLines(out, QMD_FILE, useBytes = TRUE)