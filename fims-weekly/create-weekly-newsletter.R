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
#' source(here::here("fims-weekly/create-weekly-newsletter.R"))
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
      week_range <- paste(
        format(week_start, "%B %d"), "-", 
        format(week_end, "%d, %Y")
      )
    } else {
      # If different months, show both months
      week_range <- paste(
        format(week_start, "%B %d"), "-", 
        format(week_end, "%B %d, %Y")
      )
    }
    file_name <- paste0(format(week_start, "%m.%d.%Y"), ".qmd")
    if (!is.null(file_name)) file_path <- file.path(here::here("fims-weekly"), file_name)
  
  yaml <- sprintf(
'---
title: "%s"
date: "%s"
# Fill categories in below. Look to previous FIMS weekly newsletters for examples.
# These examples include: testing, projections, selectivity, diagnostics, etc.
categories: 
  - cat1
  - cat2
---

![](images/fims_weekly.png){fig-alt="FIMS hex icon and noaa logo with text saying FIMS Weekly"}

<div style="height:3em;"></div>

::: {.columns .equal-h2-cols}
::: {.column width="70%"}

<div class="header-wrap"><h2>THREE BIG THINGS THIS WEEK</h2></div>
1. 
2. 
3. 

:::

::: {.column width="30%"}
<div class="header-wrap"><h2>HELPFUL RESOURCES</h2></div>
- [FIMS Outreach Activities](https://docs.google.com/spreadsheets/d/1g60HmAw8w_CIWBbQwTbq-oWs1ChdTTqvCREVQ8e66sE/edit?gid=0#gid=0)
- [NMFS Open Science Calendar](https://calendar.google.com/calendar/embed?src=c_916b6948ef2ee8b7d49c28661efc0798303c2742be399c9290fa02d9320c769e%40group.calendar.google.com&ctz=America%2FNew_York)
- [Implementation Team Notes](https://docs.google.com/document/d/10nSfbPaBF2p7wL2cr5lW7PGZxlZI4tbPiwQRC8JKaXk/edit?usp=drive_link)
- [FIMS FAQs](https://noaa-fims.github.io/faq)
- [NOAA-FIMS Discussions](http://github.com/orgs/NOAA-FIMS/discussions)
:::

:::

::: {.columns}
::: {.column}
## FIMS ANNOUNCEMENTS
- 
- 
:::

::: {.column}
## UPCOMING EVENTS
### Tuesday, 
**FIMS Code Club**
Time: 13:00–14:00 E; 10:00–11:00 P; 9:00–10:00 AK; 7:00–8:00 H 
Location: Virtual
Online: [Google Meet](http://meet.google.com/ica-ieta-ndu)

### Thursday, 
**FIMS Seaside Chat**
Time: 13:00–14:00 E; 10:00–11:00 P; 9:00–10:00 AK; 7:00–8:00 H
Location: Virtual
Online: [Google Meet](http://meet.google.com/scg-pyqi-ghj)
:::
:::

## PHOTO OF THE WEEK
![](images/PHOTO_NAME.png){height="150%" fig-alt="ALTERNATIVE TEXT"}

',
    week_range, format(week_start, "%B %d, %Y")
    )
  writeLines(yaml, file_path) 
  message("Created: ", file_path) 
  invisible(file_path)
}