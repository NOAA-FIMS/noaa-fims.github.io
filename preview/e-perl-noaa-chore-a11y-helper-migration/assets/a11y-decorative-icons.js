(function () {
  if (!window.__A11Y_HELPERS_ACTIVE__) {
    window.__A11Y_HELPERS_ACTIVE__ = true;
  }

  const iconSelector = "i.fa, i.fas, i.far, i.fab, i.bi";

  function hasAccessibleName(element) {
    const ariaLabel = element.getAttribute("aria-label");
    const title = element.getAttribute("title");
    const text = Array.from(element.childNodes)
      .filter((child) => !(
        child.nodeType === Node.ELEMENT_NODE &&
        child.classList.contains("a11y-sr-only")
      ))
      .map((child) => child.textContent)
      .join("")
      .trim();

    return Boolean(
      (ariaLabel && ariaLabel.trim()) ||
      (title && title.trim()) ||
      text
    );
  }

  function hideNamedControlIcons() {
    document.querySelectorAll(iconSelector).forEach((icon) => {
      const control = icon.closest("a, button");
      if (!control) return;

      if (!hasAccessibleName(control)) {
        const iconLabel = icon.getAttribute("aria-label") || icon.getAttribute("title");
        const warning = Array.from(control.querySelectorAll(".a11y-sr-only"))
          .map((element) => element.textContent.trim())
          .filter(Boolean)
          .join(" ");

        if (iconLabel && iconLabel.trim()) {
          control.setAttribute("aria-label", `${iconLabel.trim()}${warning ? ` ${warning}` : ""}`);
        }
      }

      if (hasAccessibleName(control)) icon.setAttribute("aria-hidden", "true");
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    hideNamedControlIcons();

    const iconObserver = new MutationObserver(hideNamedControlIcons);
    iconObserver.observe(document.body, {
      attributes: true,
      attributeFilter: ["aria-label", "class", "title"],
      childList: true,
      subtree: true,
    });
  });
})();
