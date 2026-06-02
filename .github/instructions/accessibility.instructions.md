---
applyTo: **/*.qmd, **/*.scss, **/*.css, **/*.js, _quarto.yml
---

When generating or reviewing code or content for this Quarto project, ensure accessibility compliance by following these priorities, remembering that the workflow of this repository is to render and publish from `main` to the `gh-pages` branch:

## Semantic Structure and HTML First
- Rely on proper Quarto Markdown structure to generate semantic HTML5. When custom CSS (like cards) requires raw HTML, ensure semantic tags are still used.
- Structure headings sequentially (`#` → `##` → `###`, never skip levels).
- Use exactly one top-level heading (`#`) per `.qmd` page as the document title.
- Configure clear, descriptive navigation labels in `_quarto.yml` (e.g., for sidebars and navbars).
- **Prefer native HTML over ARIA:** Use `<button>` for interactive click elements, not `<div role="button">`. Native elements have built-in keyboard support. 
- Avoid "Div Soup" by ensuring every page relies on `<nav>`, `<main>`, `<header>`, and `<footer>` rather than generic `<div>` tags.

## Essential Media and Data Visualization Requirements
- Provide `alt` text for all static images using Markdown: `![Descriptive text describing function/content](image.png)`.
- For code chunks generating plots (R/Python/Julia), use the `fig-alt` chunk option: `#| fig-alt: "Description of data trends"`.
- Do not rely solely on color to convey information in charts. Add shapes, patterns, or direct text labels to data visualizations.
- **Media:** Any embedded `<video>` must include a `<track kind="captions">`. Do not use the `autoplay` attribute for audio or video unless the media is muted by default.

## Keyboard Navigation & Focus Management
- Ensure any custom interactive elements introduced via JavaScript are keyboard accessible.
- Never remove focus outlines in custom `.css` or `.scss` files without providing a highly visible custom alternative (minimum 2px outline).
- Preserve logical tab order that matches the visual layout when adding custom grid/flexbox CSS.
- **Focus Not Obscured:** Ensure focused elements are not hidden by overlaying elements (like Quarto's sticky headers or navigation sidebars). Add `scroll-padding-top` to the CSS `html` or `body` element to account for fixed headers.
- **Focus Trapping:** Ensure that any custom modals or expanded tabsets handle focus correctly. When a modal or full-screen plot closes, focus must be returned to the triggering button.

## ARIA & Screen Reader Compatibility
- Avoid generic link text in Markdown. 
  - Good: `[Download the accessibility report (PDF, 2MB)](report.pdf)`
  - Avoid: `[Click here](report.pdf)` or `[Read more](link.html)`
- If creating custom collapsible content via HTML/JS, ensure `aria-expanded` is toggled properly.
- **Dynamic Content:** If injecting dynamic content via custom JS or Observable JS (OJS), announce updates to screen readers:
  - Use `aria-live="polite"` for status updates.
  - Use `aria-live="assertive"` for urgent notifications.
- **The ARIA Hidden Trap:** Never use `aria-hidden="true"` on a focusable element (like a button, link, or `tabindex="0"`). This creates a "ghost" element that keyboard users can tab to, but screen readers will completely ignore. Use `inert`, `hidden`, or remove the `href` / `tabindex` instead.

## Color and Contrast (SCSS & Themes)
- When overriding Quarto's Bootstrap variables in custom `.css` and `.scss`, ensure your chosen colors meet contrast requirements:
  - Normal text: Minimum 4.5:1 contrast ratio against backgrounds.
  - Large text or UI components: Minimum 3:1 contrast ratio.
- Check contrast ratios for code highlighting themes (`highlight-style` in `_quarto.yml`).

## Custom Form Standards
**If embedding raw forms inside `.qmd` files:**
- Associate every input with a `<label>` element.
- Group related fields with `<fieldset>` and `<legend>`.
- Display validation errors immediately after the field using `aria-describedby`.
- Ensure standard ARIA roles are applied when semantic HTML isn't sufficient. 

**Example of raw HTML error message format:**
```html
<input type="email" aria-describedby="email-error" aria-invalid="true">
<div id="email-error">Please enter a valid email address</div>
```