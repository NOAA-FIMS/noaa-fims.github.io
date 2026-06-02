---
applyTo: **/*.js, **/*.qmd, **/*.html, .github/workflows/*.yml
---

When generating code, reviewing pull requests, or analyzing this repository, you must strictly enforce the following security standards to prevent vulnerabilities in our Quarto-generated site and CI/CD pipelines.

## JavaScript & DOM Manipulation (XSS Prevention)
- **Never use `innerHTML` or `insertAdjacentHTML`** with unsanitized data, user input, or URL parameters. Always use `textContent` or `innerText` to safely update the DOM.
- **Do not use `eval()`**, `setTimeout(string)`, or `setInterval(string)`.
- Validate and sanitize any data read from `window.location` (e.g., query parameters, hash fragments) before using it in application logic or rendering it on the page.
- Ensure any dynamically generated links use secure protocols (`https://`, `mailto:`). explicitly reject `javascript:` URIs.

## Content Security Policy (CSP) & Headers
- When suggesting `<meta>` tags or Quarto HTML head includes, prioritize strict Content Security Policy (CSP) rules.
- Minimize the use of inline scripts (`<script>...</script>` directly in HTML) in favor of external, version-controlled `.js` files.
- If integrating third-party widgets (e.g., mapping tools, data visualizations), ensure they are loaded securely via HTTPS.

## GitHub Actions & CI/CD Security
- **Least Privilege:** Ensure all `.yml` workflow files explicitly define minimum `permissions` at the job or workflow level (e.g., `contents: read`, `pages: write`).
- **Pinning Actions:** When adding third-party GitHub Actions, pin them to their full 40-character commit SHA rather than a mutable version tag (e.g., use `uses: actions/checkout@<SHA>` instead of `@v4`).
- **Secrets:** Never hardcode sensitive tokens or API keys in workflow files, scripts, or Quarto configuration files. Always use GitHub Secrets (e.g., `${{ secrets.DEPLOY_TOKEN }}`).
- **Dependency Execution:** Do not pipe curl outputs directly into bash (`curl ... | bash`) in workflows without verifying the script hash.

## External Data & Dependencies
- If writing JavaScript that fetches external data, strictly enforce HTTPS endpoint usage.
- Do not commit sensitive data, PII (Personally Identifiable Information), or internal server names to `.qmd` or data files.
- Ensure any loaded JavaScript libraries (via CDN or local) specify exact versions and include subresource integrity (`integrity="sha384-..."`) attributes where applicable.

---

**Code Generation Rule:** When suggesting JavaScript code, add a comment briefly explaining why the DOM manipulation method chosen is secure against XSS. When suggesting GitHub Actions workflows, explicitly state the permissions boundary used.