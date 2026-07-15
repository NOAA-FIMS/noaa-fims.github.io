// ==========================================================================
// FIMS PATHWAY EXPLORER
// ==========================================================================
const preloadedImages = [];
const imageList = [
  "images/fims-user1.png",
  "images/fims-user2.png",
  "images/fims-user3.png",
  "images/fims-user4.png",
  "images/fims-user5.png",
];

imageList.forEach((src) => {
  const img = new Image();
  img.src = src;
  preloadedImages.push(img);
});

function stateFromImageSrc(src) {
  const m = src.match(/fims-user(\d+)\.png$/);
  return m ? `user${m[1]}` : null;
}

function setVisibleLinksForState(state) {
  const links = document.querySelectorAll(".fims-graphic-container a.link-hotspot");

  links.forEach((a) => {
    const showOn = (a.dataset.showOn || "").trim();
    const allowed = showOn.split(/\s+/).filter(Boolean);
    const shouldShow = allowed.includes(state);

    a.classList.toggle("is-visible", shouldShow);

    // Accessibility: keep hidden links out of screen readers + tab order
    if (shouldShow) {
      a.removeAttribute("aria-hidden");
      a.removeAttribute("tabindex");
    } else {
      a.setAttribute("aria-hidden", "true");
      a.setAttribute("tabindex", "-1");
    }
  });
}

// RESTORED: Expose globally so inline onclick attributes work natively
window.changeImage = function(newSrc, newAltText) {
  const mainImage = document.getElementById("fims-main-img");
  if (!mainImage) return;

  // Swap picture and alt text
  mainImage.src = newSrc;
  mainImage.alt = newAltText;

  // Toggle hotspots
  const state = stateFromImageSrc(newSrc);
  setVisibleLinksForState(state || "__none__");
};

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
  const fixScrollableCodeBlocks = () => {
    const selector = ".sourceCode:not([tabindex='0']), #photo-code pre:not([tabindex='0']), .panelset--bordered .panel:not([tabindex='0'])";
    const codeBlocks = document.querySelectorAll(selector);
    codeBlocks.forEach(function(block) {
      block.setAttribute("tabindex", "0");
    });
  };

  fixScrollableCodeBlocks();
  document.addEventListener('shown.bs.tab', fixScrollableCodeBlocks);

  const applyListingLabels = () => {
    const listing = document.getElementById("listing-listing");
    if (!listing) return;

    const filter = listing.querySelector("input.search.form-control");
    if (filter && !filter.hasAttribute("aria-label")) {
      filter.setAttribute("aria-label", "Filter content");
      filter.setAttribute("title", "Filter content");
    }

    const sort = listing.querySelector("select.form-select");
    if (sort && !sort.hasAttribute("aria-label")) {
      sort.setAttribute("aria-label", "Sort content");
      sort.setAttribute("title", "Sort content");
    }

    listing.querySelectorAll("a.no-external[href]").forEach((link) => {
      if (link.textContent.trim() || link.getAttribute("aria-label")) return;
      const card = link.closest(".quarto-post, .card, .quarto-grid-item, tr");
      const title = card?.querySelector(".listing-title, .title, .card-title, h2, h3, h4, h5")?.textContent?.trim();
      const label = title ? `Read more about ${title}` : "Read more about this item";
      link.setAttribute("aria-label", label);
      link.setAttribute("title", label);
    });
  };

  applyListingLabels();
  setInterval(applyListingLabels, 500);
}

// Consolidate all script initializations
document.addEventListener("DOMContentLoaded", () => {
  // Init pathway explorer state based on the graphic on page load
  const img = document.getElementById("fims-main-img");
  if (img) {
    const state = stateFromImageSrc(img.getAttribute("src") || "");
    setVisibleLinksForState(state || "__none__");
  }
  
  initFormAccessibility();
  initQuartoAccessibilityFixes();
  addPageSpecificClass();
});