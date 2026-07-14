const DEFAULT_PATHWAY = {
  state: "user0",
  image: "images/fims-user0.png",
  alt: "Overview of FIMS user pathways",
  label: "Overview",
  caption: "Overview of FIMS user pathways.",
};

// Preload images to prevent flicker on change
["images/fims-user1.png", "images/fims-user2.png", "images/fims-user3.png", "images/fims-user4.png", "images/fims-user5.png"].forEach((src) => {
  const img = new Image();
  img.src = src;
});

function getPathwayConfig(state) {
  if (!state || state === DEFAULT_PATHWAY.state) {
    return DEFAULT_PATHWAY;
  }
  const control = document.querySelector(`[data-pathway-button][data-pathway="${state}"]`);
  if (!control) {
    return DEFAULT_PATHWAY;
  }
  return {
    state,
    image: control.dataset.image,
    alt: control.dataset.alt,
    label: control.dataset.label,
    caption: control.dataset.caption,
  };
}

function setVisibleLinksForState(state) {
  document.querySelectorAll(".fims-graphic-container a.link-hotspot").forEach((link) => {
    const showOn = (link.dataset.showOn || "").trim();
    const shouldShow = showOn.split(/\s+/).filter(Boolean).includes(state);
    link.classList.toggle("is-visible", shouldShow);
    link.setAttribute("aria-hidden", String(!shouldShow));
    link.tabIndex = shouldShow ? 0 : -1;
  });
}

function setActivePathway(state) {
  const config = getPathwayConfig(state);
  const mainImage = document.getElementById("fims-main-img");
  const caption = document.getElementById("pathway-caption");
  const status = document.getElementById("pathway-status");

  if (mainImage) { mainImage.src = config.image; mainImage.alt = config.alt; }
  if (caption) { caption.textContent = config.caption; }
  if (status) {
    status.textContent = `Selected pathway: ${config.label}.`;
  }

  // Update button pressed state
  document.querySelectorAll("[data-pathway-button]").forEach((button) => {
    const isActive = button.dataset.pathway === state;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });

  // Update visible link hotspots
  setVisibleLinksForState(state);
}

function initPathwayExplorer() {
  const pathwayRoot = document.querySelector("[data-pathway-root]");
  if (!pathwayRoot) return;

  // Add click listeners to all pathway buttons
  document.querySelectorAll("[data-pathway-button]").forEach((button) => {
    button.addEventListener("click", () => {
      setActivePathway(button.dataset.pathway);
    });
  });

  // Set initial state from the image that's there on page load
  const img = document.getElementById("fims-main-img");
  const m = img ? (img.getAttribute("src") || "").match(/fims-user(\d+)\.png$/) : null;
  const initialState = m ? `user${m[1]}` : DEFAULT_PATHWAY.state;
  setActivePathway(initialState || DEFAULT_PATHWAY.state);
}

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
window.EMAIL_INVALID_MESSAGE =
  window.SMS_INVALID_MESSAGE = "The information provided is invalid. Please review the field format and try again.";
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
// The following functions address native accessibility gaps in Quarto's HTML generation.
// ==========================================================================

function addPageSpecificClass() {
  // Add a class to the body if we're on a blog page, to allow blog-specific styling.
  if (window.location.pathname.includes('/blog/')) {
    document.body.classList.add('page-blog');
  }
}

function initQuartoAccessibilityFixes() {
  
  // FIX 1: Scrollable Code Blocks (axe: scrollable-region-focusable)
  const fixScrollableCodeBlocks = () => {
    // Quarto generates <div class="sourceCode"> for R/Python code blocks. If these blocks 
    // contain long lines of code, they scroll horizontally. However, Quarto forgets to add 
    // tabindex="0", meaning keyboard-only users cannot focus on the block to scroll it.
    // We also target other custom scrollable <pre> and .panel blocks that might be missed. A descendant selector is used for #photo-code for robustness.
    const selector = ".sourceCode:not([tabindex='0']), #photo-code pre:not([tabindex='0']), .panelset--bordered .panel:not([tabindex='0'])";
    const codeBlocks = document.querySelectorAll(selector);
    codeBlocks.forEach(function(block) {
      // This is a secure way to modify an element's attributes without risk of XSS.
      block.setAttribute("tabindex", "0");
    });
  };

  // Run on initial load for all static code blocks.
  fixScrollableCodeBlocks();

  // Also re-run when a tab is shown in a panelset, for dynamically-visible code blocks.
  // This relies on the 'shown.bs.tab' event from Bootstrap, which Quarto uses for panelsets.
  // We listen on the whole document because the event bubbles up.
  document.addEventListener('shown.bs.tab', fixScrollableCodeBlocks);

  // FIX 2: Quarto Listings (axe: link-name)
  // Quarto frequently regenerates the DOM, stripping away accessible names.
  // This interval aggressively re-applies them every 500ms.
  const applyListingLabels = () => {
    const listing = document.getElementById("listing-listing");
    if (!listing) return;

    // Fix Filter Input
    const filter = listing.querySelector("input.search.form-control");
    if (filter && !filter.hasAttribute("aria-label")) {
      filter.setAttribute("aria-label", "Filter content");
      filter.setAttribute("title", "Filter content");
    }

    // Fix Sort Select
    const sort = listing.querySelector("select.form-select");
    if (sort && !sort.hasAttribute("aria-label")) {
      sort.setAttribute("aria-label", "Sort content");
      sort.setAttribute("title", "Sort content");
    }

    // Fix Empty Card Links
    listing.querySelectorAll("a.no-external[href]").forEach((link) => {
      if (link.textContent.trim() || link.getAttribute("aria-label")) return;

      const card = link.closest(".quarto-post, .card, .quarto-grid-item, tr");
      const title = card?.querySelector(".listing-title, .title, .card-title, h2, h3, h4, h5")?.textContent?.trim();

      const label = title ? `Read more about ${title}` : "Read more about this item";
      link.setAttribute("aria-label", label);
      link.setAttribute("title", label);
    });
  };

  // Run immediately, and set a persistent interval to catch Quarto's asynchronous rendering
  applyListingLabels();
  setInterval(applyListingLabels, 500);

  // FIX 3: Contributor list role validation (axe: aria-required-children)
  // On the contributors page, the generated list may have intermediate
  // content that breaks the grid layout and accessibility. This polls for a
  // few seconds to find and repair the structure.
  const fixContributorList = () => {
    const list = document.querySelector("#contributors [role='list']");
    if (!list) return false; // List not ready yet.

    // Find and move any <section> elements that are incorrectly inside the list.
    const misplacedSections = list.querySelectorAll('section');
    if (misplacedSections.length > 0) {
      list.after(...misplacedSections);
    }

    // Find and wrap any stray <a> tags that are not inside a listitem.
    const strayAnchors = Array.from(list.children).filter(child => child.tagName === 'A');
    if (strayAnchors.length > 0) {
      strayAnchors.forEach(anchor => {
        const wrapper = document.createElement('div');
        wrapper.setAttribute('role', 'listitem');
        anchor.parentNode.replaceChild(wrapper, anchor);
        wrapper.appendChild(anchor);
      });
    }
    // The fix is "done" if there's nothing left to repair.
    return misplacedSections.length === 0 && strayAnchors.length === 0;
  };

  let attempts = 0;
  const interval = setInterval(() => {
    if (fixContributorList() || ++attempts > 20) clearInterval(interval);
  }, 250);
}

// Consolidate all script initializations into a single DOMContentLoaded event
document.addEventListener("DOMContentLoaded", () => {
  initPathwayExplorer();
  initFormAccessibility();
  initQuartoAccessibilityFixes();
  addPageSpecificClass();
});