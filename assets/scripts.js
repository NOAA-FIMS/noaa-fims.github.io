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

  const button = document.querySelector(
    `.pathway-controls [data-pathway="${state}"]`,
  );

  if (!button) {
    return DEFAULT_PATHWAY;
  }

  return {
    state,
    image: button.dataset.image || DEFAULT_PATHWAY.image,
    alt: button.dataset.alt || DEFAULT_PATHWAY.alt,
    label: button.dataset.label || button.textContent.trim() || DEFAULT_PATHWAY.label,
    caption: button.dataset.caption || button.dataset.alt || DEFAULT_PATHWAY.caption,
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

document.addEventListener("DOMContentLoaded", () => {
  initPathwayExplorer();
  initFormAccessibility();
});

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
