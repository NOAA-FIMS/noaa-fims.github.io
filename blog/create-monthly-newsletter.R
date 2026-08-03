#' Create a Quarto Monthly Newsletter Template File
#'
#' Generates a Quarto Markdown (`.qmd`) file for a weekly newsletter,
#' pre-populated with YAML front matter including title, date, categories,
#' and other structured sections. The month in the title is
#' automatically determined based on the provided date.
#' The resulting file is created in the `blog` directory.
#'
#' @param month The name of the month for the newsletter (e.g., "January", "July").
#' If `NULL`, the current month is used.
#' @param file_name Optional file name for the newsletter file. If `NULL`,
#' the file will be named as `"Month_YYYY.qmd"` (e.g., "July_2026.qmd").
#'
#' @details
#' The function automatically formats the month in the title. The file is saved 
#' in the `blog` directory (relative to your project root, using 
#' `here::here()`). The newsletter template includes placeholder fields for 
#' categories, big things, and a summary section.
#'
#' @return (Invisibly) the full path of the created `.qmd` file.
#'
#' @examples
#' # Source the function if it's not in your environment
#' # source(here::here("blog/create-monthly-newsletter.R"))
#'
#' # Create a newsletter for the current month
#' create_monthly_qmd()
#'
#' # Create a newsletter for a month in the current year
#' create_monthly_qmd(month = "July")
#'
#' @importFrom here here
#' @export
#'
create_monthly_qmd <- function(month = NULL, file_name = NULL) {
  current_year <- format(Sys.Date(), "%Y")

  if (is.null(month)) {
    # If no month is provided, use the current system date.
    month_name <- format(Sys.Date(), "%B")
  } else {
    month_name <- as.character(month)
  }

  # Validate if the provided string is a valid month name
  if (!(tolower(month_name) %in% tolower(month.name))) {
    stop("Invalid month name provided. Please use a full month name (e.g., 'January', 'July').")
  }

  target_date <- as.Date(paste("01", month_name, current_year), format = "%d %B %Y")
  # Use the first day of the month for consistency.
  month_date <- as.Date(paste0(format(target_date, "%Y-%m"), "-01"))

  month_year_str <- format(month_date, "%B %Y")

  if (is.null(file_name)) {
    file_name <- paste0(gsub(" ", "_", month_year_str), ".qmd")
  }
  file_path <- file.path(here::here("blog"), file_name)

  yaml <- sprintf(
'---
# The title MUST start with "FIMS Monthly - "
title: "FIMS Monthly - %s"
date: "%s"
# Change the following categories accordingly, but you MUST keep the fims-monthly one
categories:
  # This one will show up in the sidebar, any other categories you add will not
  # but are clickable to sort.
  - fims-monthly
big-things:
  - BIG THING 1
  - BIG THING 2
announcements:
  - ANNOUNCEMENT 1
  - ANNOUNCEMENT 2
show-calendar: true
# If there is no photo in the summary section, you can delete include-photo, path, and alt-text
# and the template will handle it for you.
# If there is code instead, please uncomment the section below named summary-code
# but still include the text portion under summary.
summary:
  text: ""
  include-photo: true
  path: "images/NAME.png"
  alt-text: ""
---

{{< include "fims-monthly-template.qmd" >}}

<!--
::: {#summary-code}
```
PUT CODE HERE
```
:::
-->
',
    month_year_str, format(Sys.Date(), "%B %d, %Y")
    )
  writeLines(yaml, file_path)
  message("Created: ", file_path)
  invisible(file_path)
}
