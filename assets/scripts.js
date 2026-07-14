const preloadedImages = [];
const imageList = [
  "images/fims-user1.png",
  "images/fims-user2.png",
  "images/fims-user3.png",
  "images/fims-user4.png",
  "images/fims-user5.png",
];

const DEFAULT_PATHWAY = {
  state: "user0",
  image: "images/fims-user0.png",
  alt: "Overview of FIMS user pathways",
  label: "Overview",
  caption: "Overview of FIMS user pathways.",
};

imageList.forEach((src) => {
  const img = new Image();
  img.src = src;
  preloadedImages.push(img);
});

function stateFromImageSrc(src) {
  const match = src.match(/fims-user(\d+)\.png$/);
  return match ? `user${match[1]}` : null;
}

function getPathwayButtons() {
  return Array.from(document.querySelectorAll("[data-pathway-button]"));
}

function getPathwayLinks() {
  return Array.from(document.querySelectorAll(".fims-graphic-container a.link-hotspot"));
}

function getPathwayConfig(state) {
  if (state === DEFAULT_PATHWAY.state) {
    return DEFAULT_PATHWAY;
  }

  const control = document.querySelector(`[data-pathway-button][data-pathway="${state}"]`);

  if (!control) {
    return DEFAULT_PATHWAY;
  }

  return {
    state,
    image: control.dataset.image || DEFAULT_PATHWAY.image,
    alt: control.dataset.alt || DEFAULT_PATHWAY.alt,
    label: control.dataset.label || control.textContent.trim() || DEFAULT_PATHWAY.label,
    caption: control.dataset.caption || control.dataset.alt || DEFAULT_PATHWAY.caption,
  };
}

function deriveLinkLabel(link) {
  const explicitLabel = (link.dataset.linkLabel || "").trim();
  if (explicitLabel) {
    return explicitLabel;
  }

  const ariaLabel = (link.getAttribute("aria-label") || "").trim();
  if (ariaLabel) {
    return ariaLabel.replace(/^Go to\s+/i, "");
  }

  return link.href;
}

function setPressedState(activeState) {
  getPathwayButtons().forEach((button) => {
    const isActive = button.dataset.pathway === activeState;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });
}

function setVisibleLinksForState(state) {
  getPathwayLinks().forEach((link) => {
    const showOn = (link.dataset.showOn || "").trim();
    const shouldShow = showOn.split(/\s+/).filter(Boolean).includes(state);
    link.classList.toggle("is-visible", shouldShow);
  });
}

function updatePathwayLinkList(state) {
  const list = document.getElementById("pathway-links-list");
  if (!list) {
    return 0;
  }

  list.replaceChildren();

  const links = getPathwayLinks().filter((link) => {
    const showOn = (link.dataset.showOn || "").trim();
    return showOn.split(/\s+/).filter(Boolean).includes(state);
  });

  if (!links.length) {
    const item = document.createElement("li");
    item.className = "pathway-links-empty";
    item.textContent =
      state === DEFAULT_PATHWAY.state
        ? "Choose a pathway above to view related links."
        : "No related links are listed for this pathway yet.";
    list.appendChild(item);
    return 0;
  }

  links.forEach((sourceLink) => {
    const item = document.createElement("li");
    const link = document.createElement("a");

    link.href = sourceLink.href;
    link.textContent = deriveLinkLabel(sourceLink);

    if (sourceLink.target) {
      link.target = sourceLink.target;
    }

    const rel = sourceLink.getAttribute("rel");
    if (rel) {
      link.rel = rel;
    }

    item.appendChild(link);
    list.appendChild(item);
  });

  return links.length;
}

function setActivePathway(state) {
  const config = getPathwayConfig(state);
  const mainImage = document.getElementById("fims-main-img");
  const caption = document.getElementById("pathway-caption");
  const status = document.getElementById("pathway-status");

  if (mainImage) {
    mainImage.src = config.image;
    mainImage.alt = config.alt;
  }

  if (caption) {
    caption.textContent = config.caption;
  }

  setPressedState(config.state);
  setVisibleLinksForState(config.state);
  const linkCount = updatePathwayLinkList(config.state);

  if (status) {
    const linkSummary =
      linkCount === 0
        ? config.state === DEFAULT_PATHWAY.state
          ? "Choose a pathway to view related links below."
          : "No related links are currently listed below."
        : `${linkCount} related ${linkCount === 1 ? "link is" : "links are"} available below.`;

    status.textContent = `Selected pathway: ${config.label}. ${linkSummary}`;
  }
}

function initPathwayExplorer() {
  const pathwayRoot = document.querySelector("[data-pathway-root]");
  if (!pathwayRoot) {
    return;
  }

  getPathwayButtons().forEach((button) => {
    button.addEventListener("click", () => {
      setActivePathway(button.dataset.pathway || DEFAULT_PATHWAY.state);
    });
  });

  const img = document.getElementById("fims-main-img");
  const initialState = img ? stateFromImageSrc(img.getAttribute("src") || "") : null;
  setActivePathway(initialState || DEFAULT_PATHWAY.state);
}

function watchMessagePanel(panelId) {
  const panel = document.getElementById(panelId);
  if (!panel) {
    return;
  }

  const observer = new MutationObserver(() => {
    const isVisible =
      !panel.hasAttribute("hidden") &&
      panel.getAttribute("aria-hidden") !== "true" &&
      window.getComputedStyle(panel).display !== "none";

    if (isVisible) {
      panel.focus();
    }
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

window.changeImage = function changeImage(newSrc, newAltText) {
  const state = stateFromImageSrc(newSrc);

  if (state) {
    setActivePathway(state);
    return;
  }

  const mainImage = document.getElementById("fims-main-img");
  const caption = document.getElementById("pathway-caption");

  if (mainImage) {
    mainImage.src = newSrc;
    mainImage.alt = newAltText;
  }

  if (caption) {
    caption.textContent = newAltText;
  }

  setPressedState(DEFAULT_PATHWAY.state);
  setVisibleLinksForState(DEFAULT_PATHWAY.state);
  updatePathwayLinkList(DEFAULT_PATHWAY.state);
};

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
  // divs or other elements between the `role="list"` container and `role="listitem"` children,
  // which is invalid. This script corrects two common cases.
  const contributorList = document.querySelector("#contributors [role='list']");
  if (contributorList) {
    // Find all direct children that are not valid listitems.
    const invalidChildren = Array.from(contributorList.children).filter(
      child => child.getAttribute('role') !== 'listitem'
    );

    invalidChildren.forEach(child => {
      // See if this invalid child contains listitems deep inside.
      const listItems = child.querySelectorAll("[role='listitem']");
      if (listItems.length > 0) {
        // Case 1: It's a wrapper. Unwrap it by moving the listitems to be direct
        // children of the list, preserving order.
        listItems.forEach(item => contributorList.insertBefore(item, child));
        child.remove();
      } else {
        // Case 2: It's a stray element (like a div generated by Quarto's grid system)
        // that doesn't contain a listitem. Wrap it in a listitem to make it valid.
        const newListItem = document.createElement('div');
        newListItem.setAttribute('role', 'listitem');
        child.parentNode.replaceChild(newListItem, child);
        newListItem.appendChild(child);
      }
    });
  }
}

// Consolidate all script initializations into a single DOMContentLoaded event
document.addEventListener("DOMContentLoaded", () => {
  initPathwayExplorer();
  initFormAccessibility();
  initQuartoAccessibilityFixes();
});