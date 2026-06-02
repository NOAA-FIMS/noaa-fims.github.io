# Contributing

This repository contains the source for the FIMS website which uses Quarto. Most edits should be made in Quarto source files and shared assets.

## Repository Workflow

This site is rendered from `main` and published to the `gh-pages` branch by GitHub Actions. Most changes can be made on a branch and submitted with a Pull Request. All changes made on branches can be viewed at https://noaa-fims.github.io/preview/<<insert-your-branch-name-here>>

## Local Setup

Install the tools needed to render the site locally:

- [Quarto](https://quarto.org/docs/get-started/)
- R/Rstudio
- The R packages used during render, including `knitr` and `rmarkdown`

From the repository root, common commands are:

```powershell
quarto preview
```

This starts a local preview server and automatically rebuilds pages as you edit them.

```powershell
quarto render
```

Use a full render before opening a pull request, especially if you changed navigation, shared assets, includes, or links.

## Blog post

If you would like to create a blog post, please use the `blog/blog_template.qmd` file as your template, and follow the instructions in that file accordingly.

## Where To Make Changes

Use the source files as the editing surface whenever possible.

- Site-wide configuration lives in `_quarto.yml`.
- Page content lives in `.qmd` files such as `index.qmd`, `about/*.qmd`, `contact/*.qmd`, `resources/*.qmd`, and `blog/*.qmd`.
- Shared styling and theme overrides live in `assets/*.scss` and `assets/*.css`. Please see the [Theme and Styling section](#theme-and-styling) for more details on editing these files.
- Shared JavaScript and HTML includes live in `assets/*.js` and `assets/*.html`.

## Working With Quarto Content

Prefer Quarto Markdown for normal page content, headings, lists, callouts, links, and code blocks.

Use raw HTML only when Quarto Markdown is not sufficient for the layout or interaction you need. This repository already uses raw HTML in a few places, especially on the home page, so matching the existing pattern is fine when the design requires it.

When adding page-specific assets:

- Add CSS or JavaScript through page front matter when the asset is only needed on one page.
- Add reusable assets under `assets/` when they will be shared across multiple pages.
- If a page depends on local images or other files, make sure they are referenced correctly and included as resources when needed.

## Working With Custom HTML, CSS, and JavaScript

This site includes a meaningful amount of hand-authored HTML, CSS, SCSS, and JavaScript. Changes in those areas should be made carefully because they can affect multiple pages at once. To know what exactly you need to change in the CSS files, you will need to right click on the page, and select Inspect which will allow you to find the CSS variable names that you can then change in the CSS files.

### HTML Includes

Some HTML is injected globally through Quarto includes configured in `_quarto.yml`.

- `assets/skip-link.html` adds accessibility markup before the page body.
- `assets/open-in-new-tab.html` adds link behavior after the page body.

Update these files when you need site-wide HTML behavior. Keep changes small and test several pages afterward.

### Theme and Styling

The site theme is assembled from Quarto theme settings plus custom SCSS files.

- `assets/styles-elm-light.scss`
- `assets/styles-elm-dark.scss`
- `assets/styles-elm-base.scss`
- `assets/colors.scss`
- `assets/zephyr-dark.scss`
- `assets/panelset-extras.css`

Use these files for shared visual changes. Prefer updating the existing theme layers instead of introducing another standalone stylesheet unless the change is intentionally page-specific.

For styling, please put all changes in the `assets/styles-elm-light.scss` file. However, if you are making changes to the home page styling, please do those in `assets/index.css`.

If you need to assign colors that match the rest of the website theming, you can find all the colors defined in `assets/colors.scss` and assigned further in `assets/styles-elm-light.scss`. 

When editing CSS or SCSS:

- Preserve responsive behavior on desktop and mobile.
- Check hover, focus, and keyboard states for accessibility.
- Be cautious with selectors that target Quarto-generated markup, since they may affect multiple templates.
- Prefer extending existing styles instead of duplicating similar rules in multiple files.

### JavaScript

Custom JavaScript is used for interactive pieces such as the home page pathway graphic.

- Keep scripts scoped to the smallest possible surface.
- Prefer progressive enhancement over behavior that blocks basic navigation.
- Preserve accessibility attributes such as `aria-hidden`, `aria-label`, and keyboard behavior when changing interactive elements.
- Test the relevant page in `quarto preview` after any JavaScript edit.

If the behavior is specific to one page, keep the script page-scoped or place it in a clearly named asset file and load it only where needed.

## Generated Files And Output

Do not use rendered HTML as the primary source of truth.

- Edit `.qmd`, `.scss`, `.css`, `.js`, and shared asset files first.
- Regenerate output with Quarto instead of hand-editing output files whenever possible.
- Treat `fims-weekly/*.html` as published artifacts unless there is a specific reason to patch output directly.

The repository uses `execute.freeze: auto`, so Quarto may preserve rendered results for unchanged pages. If a page is not updating the way you expect, rerun `quarto render` and verify you changed the actual source file.

## Before Opening A Pull Request

Before submitting a contribution:

1. Preview the site locally with `quarto preview` or look at the https://noaa-fims.github.io/preview/<<insert-your-branch-name-here>>.
2. Check the pages affected by your change, especially if you edited shared navigation, theme files, includes, or scripts.
3. Confirm that new links, images, and downloadable assets resolve correctly.
4. Make sure generated output was updated only when appropriate.

Small, focused pull requests are easier to review than broad mixes of content, style, and behavior changes.

## Pull Request Notes

In your pull request description, include:

- What changed
- Which pages or sections were affected
- Whether you changed shared assets or page-specific files
- Any manual checks you ran, such as `quarto preview` or viewing the preview online

If your change touches custom HTML, CSS, or JavaScript, mention that explicitly so reviewers know to validate layout and interaction behavior.