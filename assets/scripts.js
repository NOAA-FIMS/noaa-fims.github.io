// ==========================================================================
// BREVO FORM ACCESSIBILITY
// ==========================================================================
function watchMessagePanel(panelId) {
  const panel = document.getElementById(panelId);
  if (!panel) return;

  const observer = new MutationObserver(() => {
    const isVisible = !panel.hasAttribute("hidden") && panel.getAttribute("aria-hidden") !== "true" && window.getComputedStyle(panel).display !== "none";
    if (isVisible) panel.focus();
  });

  observer.observe(panel, {
    attributes: true,
    attributeFilter: ["class", "style", "hidden", "aria-hidden"],
  });
}

function initFormAccessibility() {
  watchMessagePanel("error-message");
  watchMessagePanel("success-message");
}

window.REQUIRED_CODE_ERROR_MESSAGE = "Please choose a country code";
window.LOCALE = "en";
window.EMAIL_INVALID_MESSAGE = window.SMS_INVALID_MESSAGE = "The information provided is invalid. Please review the field format and try again.";
window.REQUIRED_ERROR_MESSAGE = "This field cannot be left blank. ";
window.GENERIC_INVALID_MESSAGE = "The information provided is invalid. Please review the field format and try again.";
window.INVALID_NUMBER = "The information provided is invalid. Please review the field format and try again.";
window.INVALID_DATE = "Please enter a valid date";
window.REQUIRED_MULTISELECT_MESSAGE = "Please select at least 1 option";
window.translation = {
  common: {
    selectedList: "{quantity} list selected",
    selectedLists: "{quantity} lists selected",
    selectedOption: "{quantity} selected",
    selectedOptions: "{quantity} selected",
  },
};
var AUTOHIDE = Boolean(0);

// ==========================================================================
// QUARTO ACCESSIBILITY FIXES
// ==========================================================================
function addPageSpecificClass() {
  if (window.location.pathname.includes('/blog/')) {
    document.body.classList.add('page-blog');
  }
}

function initQuartoAccessibilityFixes() {
  // Hides decorative icons in the Quarto sidebar from screen readers by adding aria-hidden="true".
  // These icons don't convey information and can be noisy for assistive technology users.
  const hideDecorativeSidebarIcons = () => {
    document.querySelectorAll('.quarto-sidebar i[role="img"]').forEach((icon) => {
      icon.setAttribute("aria-hidden", "true");
    });
  };

  // Makes scrollable code blocks and panels keyboard-focusable.
  // By adding tabindex="0", users can navigate to these elements using the Tab key
  // and scroll through them, which is essential for accessibility.
  const fixScrollableCodeBlocks = () => {
    const selector = ".sourceCode:not([tabindex='0']), #photo-code pre:not([tabindex='0']), .panelset--bordered .panel:not([tabindex='0'])";
    const codeBlocks = document.querySelectorAll(selector);
    codeBlocks.forEach(function(block) {
      block.setAttribute("tabindex", "0");
    });
  };

  // Initial call to apply fixes on page load.
  fixScrollableCodeBlocks();
  hideDecorativeSidebarIcons();
  // Re-apply the scrollable code block fix when a Bootstrap tab is shown.
  // This ensures that code blocks inside newly visible tabs are also accessible.
  document.addEventListener('shown.bs.tab', fixScrollableCodeBlocks);

  // Use a MutationObserver to watch for changes in the document body.
  // This ensures that if the sidebar is dynamically updated (e.g., by Quarto),
  // the decorative icons are hidden again.
  const sidebarObserver = new MutationObserver(hideDecorativeSidebarIcons);
  sidebarObserver.observe(document.body, { childList: true, subtree: true });

  // Adds accessible labels to controls and links within Quarto listings.
  // Listings are often generated dynamically, and their controls may lack proper labels.
  const applyListingLabels = () => {
    const listing = document.getElementById("listing-listing");
    if (!listing) return;

    // Add an ARIA label to the search/filter input field for screen readers.
    const filter = listing.querySelector("input.search.form-control");
    if (filter && !filter.hasAttribute("aria-label")) {
      filter.setAttribute("aria-label", "Filter content");
      filter.setAttribute("title", "Filter content");
    }

    // Add an ARIA label to the sort dropdown menu.
    const sort = listing.querySelector("select.form-select");
    if (sort && !sort.hasAttribute("aria-label")) {
      sort.setAttribute("aria-label", "Sort content");
      sort.setAttribute("title", "Sort content");
    }

    // Find "read more" links that are empty and give them a descriptive aria-label.
    // It finds the post title from the surrounding card and creates a label like "Read more about [Post Title]".
    listing.querySelectorAll("a.no-external[href]").forEach((link) => {
      // Skip if the link already has text or an aria-label.
      if (link.textContent.trim() || link.getAttribute("aria-label")) return;
      // Find the parent card or item to get context.
      const card = link.closest(".quarto-post, .card, .quarto-grid-item, tr");
      // Find a title element within the card.
      const title = card?.querySelector(".listing-title, .title, .card-title, h2, h3, h4, h5")?.textContent?.trim();
      // Create a descriptive label.
      const label = title ? `Read more about ${title}` : "Read more about this item";
      link.setAttribute("aria-label", label);
      link.setAttribute("title", label);
    });
  };

  // Apply labels on initial load.
  applyListingLabels();
  // Periodically re-apply labels to handle dynamically loaded content in listings.
  // This is a fallback for when content is added after the initial page load.
  setInterval(applyListingLabels, 500);
}

// Consolidate non-graphic script initializations
document.addEventListener("DOMContentLoaded", () => {
  initFormAccessibility();
  initQuartoAccessibilityFixes();
  addPageSpecificClass();
  const img = document.getElementById("fims-main-img");
  const state = img ? stateFromImageSrc(img.getAttribute("src") || "") : null;
  setVisibleLinksForState(state || "__none__");
});
