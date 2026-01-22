# Code to get the names and urls of repos that have pkgdown sites and GitHub pages
# enabled and put them in the `sites_index.qmd` file.
library(dplyr)
library(purrr)
library(gh)
library(tibble)

org <- "NOAA-FIMS"
repos <- gh::gh("/orgs/{org}/repos", org = org, .limit = Inf)
repo_names <- vapply(repos, function(x) x$name, character(1))

results <- map_dfr(repo_names, function(repo) {
  repo_meta <- tryCatch(gh::gh("/repos/{owner}/{repo}", owner = org, repo = repo), error = function(e) NULL)
  branch <- if (!is.null(repo_meta$default_branch)) repo_meta$default_branch else "main"
  tree <- tryCatch(gh::gh("/repos/{owner}/{repo}/git/trees/{tree_sha}?recursive=1", owner = org, repo = repo, tree_sha = branch), error = function(e) NULL)
  pkgdown_exists <- FALSE
  pkgdown_path <- NA
  if (!is.null(tree) && !is.null(tree$tree)) {
    pkgdown_files <- vapply(tree$tree, function(file) file$path, character(1))
    idx <- grep("pkgdown.yml$", pkgdown_files)
    if (length(idx) > 0) {
      pkgdown_exists <- TRUE
      pkgdown_path <- pkgdown_files[idx[1]]
    }
  }
  pages <- tryCatch(gh::gh("/repos/{owner}/{repo}/pages", owner = org, repo = repo), error = function(e) NULL)
  pages_enabled <- !is.null(pages)
  pages_source_docs <- pages_enabled && !is.null(pages$source) && pages$source$path == "docs"
  pages_url <- if (!is.null(pages$html_url)) pages$html_url else NA
  tibble(
    repo = repo,
    description = if (!is.null(repo_meta)) repo_meta$description else NA_character_,
    has_pkgdown = pkgdown_exists,
    pkgdown_path = pkgdown_path,
    pages_enabled = pages_enabled,
    pages_source_docs = pages_source_docs,
    github_pages_url = pages_url
  )
})

results_filt <- results %>% filter(has_pkgdown, !is.na(github_pages_url))

lines <- readLines("resources/fims-packages.yaml")

# Find all existing URL lines and extract URLs to compare
existing_urls <- grep("^- path:", trimws(lines), value = TRUE)
existing_urls <- sub("^- path:\\s+", "", existing_urls)

# Prepare new blocks for new sites only
new_blocks <- character(0)
new_contributors <- character(0)

for (i in seq_len(nrow(results_filt))) {
  site <- results_filt$github_pages_url[i]
  repo <- results_filt$repo[i]
  desc <- results_filt$description[i]
  found <- site %in% existing_urls
  if (!is.na(site) && !found) {
    block <- c(
      sprintf("- title: %s", repo),
      "  description: >",
      sprintf('    %s <br>', ifelse(is.na(desc), "", desc)),
      sprintf('    - [Website](%s) <br>', site),
      sprintf('    - [Repository](%s)', repo_url),
      sprintf("  path: %s", site),
      sprintf("  image: ../images/FIMS_hexlogo.png"),
      sprintf("  categories: [R]")
    )
    new_blocks <- c(new_blocks, block)
    
    contributors <- tryCatch(
      gh::gh("/repos/{owner}/{repo}/contributors", owner = org, repo = repo, .limit = 1),
      error = function(e) NULL
    )
    if (!is.null(contributors) && length(contributors) > 0) {
      username <- contributors[[1]]$login
      if (!is.null(username)) {
        new_contributors <- c(new_contributors, username)
      }
    }
  }
}

type_line <- grep("^\\s*type:\\s*default", lines)

# If 'type: default' exists, insert before it; else, append at end.
insert_line <- if (length(type_line) > 0) type_line[1] - 1 else length(lines)

if (length(new_blocks) > 0) {
  lines <- append(lines, new_blocks, after = insert_line)
  writeLines(lines, "resources/fims-packages.yaml")
}

# Save unique contributors
if (length(new_contributors) > 0) {
  new_contributors <- unique(new_contributors)
  cat(paste0("@", new_contributors, collapse = " "), file = "top_contributors.txt")
} else {
  cat("", file = "top_contributors.txt")
}