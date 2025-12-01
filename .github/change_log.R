library(httr)
library(jsonlite)
library(glue)

QMD_FILE <- "changelog/FIMS_CHANGELOG.qmd"
REPO <- "NOAA-FIMS/FIMS"
API_URL <- paste0("https://api.github.com/repos/", REPO, "/releases")

# Fetch releases from GitHub API
fetch_releases <- function(api_url) {
  token <- Sys.getenv("GITHUB_TOKEN")
  resp <- if (nzchar(token)) {
    GET(api_url, add_headers(Authorization = paste("Bearer", token)))
  } else {
    GET(api_url)
  }
  stop_for_status(resp)
  fromJSON(content(resp, as = "text", encoding = "UTF-8"))
}

# Transform direct PR/issue URLs to markdown link [#number](url)
reformat_github_urls <- function(text) {
  gsub("(https://github\\.com/NOAA-FIMS/FIMS/(issues|pull)/(\\d+))",
       "[#\\3](\\1)", text, perl = TRUE)
}

# Write the changelog in Quarto Markdown format
write_changelog <- function(releases, output_file) {
  header <- c(
    "---",
    'title: FIMS Change Log',
    "---",
    ""
  )
  lines <- header
  for (i in seq_len(nrow(releases))) {
    rel <- as.list(releases[i, ])
    rel_title <- glue("## {rel$name} ([release notes]({rel$html_url}))")
    rel_body <- if (!is.null(rel$body) && nzchar(rel$body)) rel$body else "*No release notes available.*"
    rel_body <- gsub("(?m)^[ \t]*\\* ", "- ", rel_body, perl = TRUE)
    rel_body <- reformat_github_urls(rel_body)
    lines <- c(lines, rel_title, rel_body, "", "---", "")
  }
  writeLines(lines, output_file, useBytes = TRUE)
}

# Main script
releases <- fetch_releases(API_URL)
write_changelog(releases, QMD_FILE)
