#' Create a Quarto Weekly Newsletter Template File
#'
#' Generates a Quarto Markdown (`.qmd`) file for a weekly newsletter, 
#' pre-populated with YAML front matter including title, date, categories, 
#' events, and other structured sections. The week range in the title is 
#' automatically determined based on the provided start date and optionally an 
#' end date. The resulting file is created in the `fims-weekly` directory.
#'
#' @param date The start date of the week (as a `Date` object or character 
#' string, default is today if `NULL`).
#' @param week_end_date Optional end date of the week (as a `Date` object or 
#' character string). If not provided, the week will end on the next Friday 
#' after \code{date}.
#' @param file_name Optional file name for the newsletter file. If `NULL`, 
#' the file will be named as `"mm.dd.yyyy.qmd"` using the start date.
#'
#' @details
#' The function automatically formats the week range in the title, showing both 
#' months if the week spans two different months. The file is saved in the `fims-weekly` directory (relative to your project root, using `here::here()`). The newsletter template includes placeholder fields for categories, big things, events, and photo caption.
#'
#' @return (Invisibly) the full path of the created `.qmd` file.
#'
#' @examples
#' # Source function
#' source(here::here("blog/create-weekly-newsletter.R"))
#' 
#' # Create a newsletter for the current week (ending on Friday)
#' create_weekly_qmd()
#'
#' # Create a newsletter starting from a specific date
#' create_weekly_qmd(date = "2025-07-29")
#'
#' # Specify a custom week ending date
#' create_weekly_qmd(date = "2025-07-29", week_end_date = "2025-08-01")
#'
#' # Specify a custom file name
#' create_weekly_qmd(date = "2025-07-29", file_name = "my_newsletter.qmd")
#'
#' @importFrom here here
#' @export
#' 
create_weekly_qmd <- function(date = NULL, week_end_date = NULL, file_name = NULL) {
  if(is.null(date)){
    date <- Sys.Date()
  }
    week_start <- as.Date(date)
    
    # If week_end_date is provided, use it; otherwise, find next Friday (including today if Friday)
    if (!is.null(week_end_date)) {
      week_end <- as.Date(week_end_date)
    } else {
      # 6 = Friday in as.POSIXlt()$wday (Sunday=0)
      days_ahead <- (5 - as.POSIXlt(week_start)$wday) %% 7
      week_end <- week_start + days_ahead
    }
    
    if (format(week_start, "%B") == format(week_end, "%B")) {
      week_range <- paste0(
        format(week_start, "%B %d"), "–", 
        format(week_end, "%d, %Y")
      )
    } else {
      # If different months, show both months
      week_range <- paste0(
        format(week_start, "%B %d"), "–", 
        format(week_end, "%B %d, %Y")
      )
    }
    file_name <- paste0(format(week_start, "%m.%d.%Y"), ".qmd")
    if (!is.null(file_name)) file_path <- file.path(here::here("fims-weekly"), file_name)
  
  yaml <- sprintf(
'---
title: "FIMS Weekly - %s"
date: "%s"
# Change the following categories accordingly
categories: 
  - testing
  - selectivity
  - diagnostics
  - projections
three-big-things:
  bt1: ""
  bt2: ""
  bt3: ""
# Announcements go below because of formatting that quarto doesnt transfer over from the yml
# If there is no code club or seaside chat, just delete those lines and the template will handle it for you
upcoming-events:
  code-club: true
  code-club-date: "Tuesday, "
  code-club-name: "FIMS Code Club"
  seaside-chat: true
  seaside-chat-date: "Thursday, "
  seaside-chat-name: "FIMS Seaside Chat"
# If you have any additional events, uncomment and fill out the additional events section below.
# If there is no actual photo you can delete include-photo, path, and alt-text 
# and the template will handle it for you. 
# If there is code instead, please uncomment the section below named photo-code 
# but still include the text portion under photo.
photo:
  text: ""
  include-photo: true
  path: "images/NAME.png"
  alt-text: ""
---
  
{{< include "_fims-weekly-template.qmd" >}}

::: {#announcements}
- ANNOUNCEMENT 1
- ANNOUNCEMENT 2
::: 
    
::: {#additional-events}
      
<!--
### DAY DATE
**NAME**\n
Time: TIME
Location: VIRTUAL/IN-PERSON
Online: [Google meet](MEETING LINK)
-->

:::

<!--
::: {#photo-code}
```
PUT CODE HERE
```
:::
-->
        

',
    week_range, format(week_start, "%B %d, %Y")
    )
  writeLines(yaml, file_path) 
  message("Created: ", file_path) 
  invisible(file_path)
}