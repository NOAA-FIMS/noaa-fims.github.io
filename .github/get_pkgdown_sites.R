# Code to get the names and urls of repos that have pkgdown sites and GitHub pages
# enabled and put them in the `sites_index.qmd` file.

org <- "NOAA-FIMS"

# 1. List all repos
repos <- gh::gh("/orgs/{org}/repos", org = org, .limit = Inf)
repo_names <- vapply(repos, function(x) x$name, character(1))

results <- purrr::map_dfr(repo_names, function(repo) {
  # Get repo metadata (includes About info)
  repo_meta <- tryCatch({
    gh::gh("/repos/{owner}/{repo}", owner = org, repo = repo)
  }, error = function(e) NULL)
  
  branch <- if (!is.null(repo_meta) && !is.null(repo_meta$default_branch)) repo_meta$default_branch else "main"
  
  # List files recursively
  tree <- tryCatch({
    gh::gh("/repos/{owner}/{repo}/git/trees/{tree_sha}?recursive=1",
       owner = org,
       repo = repo,
       tree_sha = branch)
  }, error = function(e) NULL)
  
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
  
  # Check for GitHub Pages and get site URL
  pages <- tryCatch({
    gh::gh("/repos/{owner}/{repo}/pages", owner = org, repo = repo)
  }, error = function(e) NULL)
  
  pages_enabled <- !is.null(pages)
  pages_source_docs <- FALSE
  pages_url <- NA
  if (pages_enabled && !is.null(pages)) {
    pages_source_docs <- !is.null(pages$source) && pages$source$path == "docs"
    # Get the site's HTML URL if present
    if (!is.null(pages$html_url)) {
      pages_url <- pages$html_url
    }
  }
  
  tibble::tibble(
    repo = repo,
    description = if (!is.null(repo_meta)) repo_meta$description else NA_character_,
    has_pkgdown = pkgdown_exists,
    pkgdown_path = pkgdown_path,
    pages_enabled = pages_enabled,
    pages_source_docs = pages_source_docs,
    github_pages_url = pages_url
  )
})

results_filt <- results |>
  dplyr::filter(has_pkgdown == TRUE)

lines <- readLines("sites/sites_index.qmd")

insert_line <- which(lines == "")[1]  # You want before the first empty line

# Prepare new lines (only for sites not already present)
new_blocks <- character(0)
new_contributors <- character(0)  
for (i in seq_len(nrow(results_filt))) {
  site <- results_filt$github_pages_url[i]
  repo <- results_filt$repo[i]
  desc <- results_filt$description[i]
  found <- any(grepl(site, lines, fixed = TRUE))
  if (!is.na(site) && !found) {
    block <- c(
      sprintf("    - path: %s", site),
      sprintf("      title: %s", repo),
      "      description: >",
      sprintf("        %s", desc)
    )
    new_blocks <- c(new_blocks, block)
    
    # ---- Fetch top contributor for this repo ----
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
    # --------------------------------------------
  }
}

if (length(new_blocks) > 0 && !is.na(insert_line)) {
  lines <- append(lines, new_blocks, after = insert_line - 1)
  writeLines(lines, "sites/sites_index.qmd")
}

# Save unique contributors to a file for GitHub Actions to use in the PR
if (length(new_contributors) > 0) {
  new_contributors <- unique(new_contributors)
  cat(paste(new_contributors, collapse = " "), file = "top_contributors.txt")
} else {
  cat("", file = "top_contributors.txt")  # Ensure the file exists, even if empty
}