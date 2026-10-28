(function () {
  window.__A11Y_HELPERS_ACTIVE__ = true;

  const scrollableSelector = "pre, .sourceCode, .panel, .quarto-code-tools, .cell-output";
  const scrollableOverflow = new Set(["auto", "scroll", "overlay"]);

  function isScrollable(element) {
    const style = window.getComputedStyle(element);
    const hasVerticalOverflow = element.scrollHeight > element.clientHeight &&
      scrollableOverflow.has(style.overflowY);
    const hasHorizontalOverflow = element.scrollWidth > element.clientWidth &&
      scrollableOverflow.has(style.overflowX);

    return hasVerticalOverflow || hasHorizontalOverflow;
  }

  function makeScrollableContainersFocusable() {
    document.querySelectorAll(scrollableSelector).forEach((element) => {
      if (element.hasAttribute("tabindex") || element.isContentEditable) return;
      if (isScrollable(element)) element.setAttribute("tabindex", "0");
    });
  }

  document.addEventListener("DOMContentLoaded", makeScrollableContainersFocusable);
  document.addEventListener("shown.bs.tab", makeScrollableContainersFocusable);
  document.addEventListener("shown.bs.collapse", makeScrollableContainersFocusable);
})();
