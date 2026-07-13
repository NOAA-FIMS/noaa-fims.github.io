// The preloader stays exactly the same
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

function setVisibleLinksForState(state) {
  const links = document.querySelectorAll(".fims-graphic-container a.link-hotspot");

  links.forEach((a) => {
    const showOn = (a.dataset.showOn || "").trim(); // e.g. "user1 user2"
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

function stateFromImageSrc(src) {
  // matches fims-user1.png ... fims-user5.png (and would match user0 too)
  const m = src.match(/fims-user(\d+)\.png$/);
  return m ? `user${m[1]}` : null;
}

// UPGRADED SWAP FUNCTION
function changeImage(newSrc, newAltText) {
  const mainImage = document.getElementById("fims-main-img");

  // 1) Swap the picture
  mainImage.src = newSrc;

  // 2) Swap the alt text for screen readers
  mainImage.alt = newAltText;

  // 3) Show/hide the appropriate href hotspots
  const state = stateFromImageSrc(newSrc);
  setVisibleLinksForState(state || "__none__");
}

// Ensure correct initial state on first page load
document.addEventListener("DOMContentLoaded", () => {
  const img = document.getElementById("fims-main-img");
  const state = img ? stateFromImageSrc(img.getAttribute("src") || "") : null;
  setVisibleLinksForState(state || "__none__");
});


window.REQUIRED_CODE_ERROR_MESSAGE = 'Please choose a country code';
window.LOCALE = 'en';
window.EMAIL_INVALID_MESSAGE = window.SMS_INVALID_MESSAGE = "The information provided is invalid. Please review the field format and try again.";
window.REQUIRED_ERROR_MESSAGE = "This field cannot be left blank. ";
window.GENERIC_INVALID_MESSAGE = "The information provided is invalid. Please review the field format and try again.";
window.INVALID_NUMBER = "The information provided is invalid. Please review the field format and try again.";
window.INVALID_DATE = "Please enter a valid date";
window.REQUIRED_MULTISELECT_MESSAGE = 'Please select at least 1 option';
window.translation = {
  common: {
    selectedList: '{quantity} list selected',
    selectedLists: '{quantity} lists selected',
    selectedOption: '{quantity} selected',
    selectedOptions: '{quantity} selected',
  }
};
var AUTOHIDE = Boolean(0);