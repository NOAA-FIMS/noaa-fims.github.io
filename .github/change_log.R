library(httr)
library(jsonlite)
library(glue)

QMD_FILE <- "changelog/FIMS_CHANGELOG.qmd"
REPO <- "NOAA-FIMS/FIMS"
API_URL <- paste0("https://api.github.com/repos/", REPO, "/releases")

# Fetch releases from GitHub API
fetch_releases <- function(api_url) {
  resp <- GET(api_url)
  stop_for_status(resp)
  fromJSON(content(resp, as = "text", encoding = "UTF-8"))
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
    lines <- c(lines, rel_title, rel_body, "", "---", "")
  }
  writeLines(lines, output_file, useBytes = TRUE)
}

# Main script
releases <- fetch_releases(API_URL)
write_changelog(releases, QMD_FILE)
