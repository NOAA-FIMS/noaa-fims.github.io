---
applyTo: **/*.qmd, **/*.scss, **/*.css, **/*.js, _quarto.yml
---

When generating or reviewing code or content for this Quarto project, ensure accessibility compliance by following these priorities, remembering that the workflow of this repository is to render and publish from `main` to the `gh-pages` branch:

## Semantic Structure and Markdown First
- Rely on proper Quarto Markdown structure to generate semantic HTML5 if it won't mess up custom css settings like cards.
- Structure headings sequentially (# → ## → ###, never skip levels).
- Use exactly one top-level heading (#) per `.qmd` page as the document title.
- Configure clear, descriptive navigation labels in `_quarto.yml` (e.g., for sidebars and navbars).

## Essential Image and Data Visualization Requirements
- Provide `alt` text for all static images using Markdown: `![Descriptive text describing function/content](image.png)`.
- For code chunks generating plots (R/Python/Julia), use the `fig-alt` chunk option: `#| fig-alt: "Description of data trends"`.
- Do not rely solely on color to convey information in charts. Add shapes, patterns, or direct text labels to data visualizations.

## CSS, JavaScript, and Keyboard Navigation
- Ensure any custom interactive elements introduced via JavaScript are keyboard accessible.
- Never remove focus outlines in custom `.css` or `.scss` files without providing a highly visible custom alternative (minimum 2px outline).
- Preserve logical tab order that matches the visual layout when adding custom grid/flexbox CSS.
- If creating custom collapsible content via HTML/JS, ensure `aria-expanded` is toggled properly. 

## Color and Contrast (SCSS & Themes)
- When overriding Quarto's Bootstrap variables in custom `.css` and `.scss`, ensure your chosen colors meet contrast requirements:
  - Normal text: Minimum 4.5:1 contrast ratio against backgrounds.
  - Large text or UI components: Minimum 3:1 contrast ratio.
- Check contrast ratios for code highlighting themes (`highlight-style` in `_quarto.yml`).

## Screen Reader Compatibility
**Provide descriptive text for all non-text content:**
- Avoid generic link text in Markdown. 
  - Good: `[Download the accessibility report (PDF, 2MB)](report.pdf)`
  - Avoid: `[Click here](report.pdf)` or `[Read more](link.html)`
- If injecting dynamic content via custom JS or Observable JS (OJS), announce updates to screen readers:
  - Use `aria-live="polite"` for status updates.
  - Use `aria-live="assertive"` for urgent notifications.

## Testing Integration Steps (GitHub Actions)
**Integrate automated checks into the GitHub Actions workflow:**
1. Insert an accessibility testing step in the workflow after running `quarto render` but before deploying to the `gh-pages` branch.
2. Run tools like axe-core, pa11y, or Lighthouse CI against the generated HTML in the `_site` output directory.
3. Fail the GitHub Actions build if critical accessibility violations are introduced and provide informative errors and instructions of how to fix these.

**Perform manual tests during local development:**
1. Navigate the Quarto site preview using only Tab and arrow keys.
2. Verify that applying 200% zoom in the browser doesn't break the layout or hide your custom UI elements.
3. Test custom interactive JS components with a screen reader (NVDA on Windows, VoiceOver on Mac).

## Custom HTML and Form Standards
**If embedding raw HTML blocks or forms inside `.qmd` files:**
- Associate every input with a `<label>` element.
- Group related fields with `<fieldset>` and `<legend>`.
- Display validation errors immediately after the field using `aria-describedby`.
- Ensure standard ARIA roles are applied when semantic HTML isn't sufficient.

**Example of raw HTML error message format:**
```html
<input type="email" aria-describedby="email-error" aria-invalid="true">
<div id="email-error">Please enter a valid email address</div>
```