# Accessibility Guidelines for FIMS Website

This document outlines accessibility best practices for maintaining the FIMS community playbook website.

## Why Accessibility Matters

Web accessibility ensures that people with disabilities can perceive, understand, navigate, and interact with our website. Following these guidelines helps us:

- Comply with WCAG 2.1 Level AA standards
- Reach a broader audience
- Improve overall user experience
- Meet federal accessibility requirements

## Key Accessibility Features Already Implemented

### 1. Language Declaration
- The website has `lang: en` set in `_quarto.yml` to help screen readers pronounce content correctly

### 2. Image Alt Text
- All images should have descriptive alt text
- Badge images have descriptive alt text (e.g., "Badge showing total open issues in FIMS repository")
- Contributor avatars include "GitHub profile avatar for [username]"

### 3. Icon Accessibility
- Decorative icons use `aria-hidden="true"`
- Icon-only links include both `aria-label` and `title` attributes
- Example: `<a href="..." aria-label="Visit FIMS on GitHub" title="FIMS on GitHub"><i class="fab fa-github" aria-hidden="true"></i></a>`

### 4. External Links
- External links automatically get:
  - `target="_blank"` and `rel="noopener"` for security
  - Visual indicator (external link icon)
  - Screen reader announcement "(opens in new window)"

### 5. Skip Navigation
- A "Skip to main content" link appears when keyboard users press Tab
- Helps users bypass repetitive navigation

### 6. Color Contrast
- Inactive tab opacity improved from 0.5 to 0.7 for better contrast
- Dark mode inactive tab opacity improved from 0.66 to 0.75

## Guidelines for Content Authors

### Adding Images

**Do:**
```markdown
![Descriptive text about the image](path/to/image.png){fig-alt="Detailed description for screen readers"}
```

**Don't:**
```markdown
![](path/to/image.png)  <!-- Missing alt text! -->
```

### Adding Icons

**Decorative icons (part of text/headings):**
```markdown
## Get involved <i class="fa-solid fa-user-plus" aria-hidden="true"></i>
```

**Icon-only links:**
```html
<a href="https://github.com/..." 
   aria-label="Visit our GitHub repository" 
   title="GitHub repository">
  <i class="fab fa-github" aria-hidden="true"></i>
</a>
```

### Adding Links

**Internal links:** No special handling needed

**External links:** 
- Our script automatically handles `target="_blank"` and accessibility attributes
- Ensure link text is descriptive (avoid "click here")

**Good:**
```markdown
[View the FIMS GitHub repository](https://github.com/NOAA-FIMS)
```

**Bad:**
```markdown
[Click here](https://github.com/NOAA-FIMS) to see our repository
```

### Heading Structure

- Use proper heading hierarchy (h1 → h2 → h3, don't skip levels)
- Each page should have only one h1
- Headings should be descriptive

### Tables

- Markdown tables are automatically converted to accessible HTML by Quarto
- Ensure first row contains headers
- Keep tables simple; complex tables may need manual HTML with proper scope attributes

## Testing Your Changes

### Automated Testing
1. Run axe DevTools or WAVE browser extension
2. Check for contrast issues with WebAIM Contrast Checker
3. Validate HTML with W3C Validator

### Manual Testing
1. **Keyboard Navigation:** Navigate the entire page using only Tab, Shift+Tab, and Enter
2. **Screen Reader:** Test with NVDA (Windows), JAWS (Windows), or VoiceOver (Mac)
3. **Zoom:** Test at 200% zoom level
4. **Dark Mode:** Verify content is readable in both light and dark modes

## Common Accessibility Issues to Avoid

1. **Missing alt text on images**
2. **Icon-only buttons/links without labels**
3. **Poor color contrast**
4. **Skipped heading levels**
5. **Non-descriptive link text ("click here")**
6. **Missing form labels**
7. **Keyboard traps**
8. **Time-based content without controls**

## Resources

- [Web Content Accessibility Guidelines (WCAG) 2.1](https://www.w3.org/WAI/WCAG21/quickref/)
- [WebAIM: Web Accessibility In Mind](https://webaim.org/)
- [Quarto Accessibility Documentation](https://quarto.org/docs/output-formats/html-basics.html#accessibility)
- [ARIA Authoring Practices Guide](https://www.w3.org/WAI/ARIA/apg/)

## Questions?

If you have questions about accessibility, please:
1. Open an issue in the repository
2. Tag it with "accessibility"
3. The team will review and provide guidance
