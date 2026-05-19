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

// Consolidate non-graphic script initializations
document.addEventListener("DOMContentLoaded", () => {
  initFormAccessibility();
  initQuartoAccessibilityFixes();
  addPageSpecificClass();
  const img = document.getElementById("fims-main-img");
  const state = img ? stateFromImageSrc(img.getAttribute("src") || "") : null;
  setVisibleLinksForState(state || "__none__");
});


// javascript for GitHub recent activity feed
async function fetchGitHubActivity() {
  const feedContainer = document.getElementById('github-activity-feed');
  if (!feedContainer) return;

  const owner = 'noaa-fims'; 
  const repo = 'fims';       

  try {
    // Let us know the script actually started running!
    feedContainer.innerHTML = '<span class="text-primary fst-italic small">Attempting to contact GitHub...</span>';
    
    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/events?per_page=10`);
    
    // If GitHub blocks us, print the exact error code to the screen
    if (!response.ok) {
      throw new Error(`GitHub Error: ${response.status} ${response.statusText}`);
    }
    
    const events = await response.json();
    
    const relevantEvents = events.filter(event => 
      event.type === 'PullRequestEvent' || event.type === 'PushEvent'
    ).slice(0, 3);

    if (relevantEvents.length === 0) {
       feedContainer.innerHTML = '<span class="text-muted small">No recent pushes or PRs found.</span>';
       return;
    }

    feedContainer.innerHTML = ''; 

    relevantEvents.forEach(event => {
      let actionText = '';
      let detailText = '';
      let branchName = '';

      if (event.type === 'PullRequestEvent') {
        actionText = `${event.payload.action} pull request`;
        detailText = event.payload.pull_request.title;
        branchName = `#${event.payload.number}`;
      } else if (event.type === 'PushEvent') {
        const commitCount = event.payload.commits.length;
        actionText = `pushed ${commitCount} commit${commitCount > 1 ? 's' : ''} to`;
        detailText = event.payload.commits[0]?.message || 'No commit message';
        branchName = event.payload.ref.replace('refs/heads/', '');
      }

      const date = new Date(event.created_at);
      const diffHours = Math.floor((new Date() - date) / (1000 * 60 * 60));
      const timeAgo = diffHours > 24 ? `${Math.floor(diffHours/24)}d ago` : `${diffHours}h ago`;

      const eventHTML = `
        <div class="d-flex align-items-start gap-3 p-3 rounded-3 border border-transparent custom-hover-bg transition-colors">
          <div class="rounded-circle bg-light overflow-hidden flex-shrink-0" style="width: 40px; height: 40px;">
            <img src="${event.actor.avatar_url}" alt="${event.actor.display_login}" class="w-100 h-100 object-fit-cover" />
          </div>
          <div class="flex-grow-1">
            <p class="mb-1 small">
              <span class="text-primary fw-bold">${event.actor.display_login}</span> 
              ${actionText} 
              <span class="text-danger font-monospace fw-bold">${branchName}</span>
            </p>
            <p class="small text-muted mb-0 fst-italic">"${detailText}"</p>
          </div>
          <span class="text-muted fw-medium" style="font-size: 0.7rem;">${timeAgo}</span>
        </div>
      `;
      feedContainer.insertAdjacentHTML('beforeend', eventHTML);
    });

  } catch (error) {
    console.error(error);
    // Print the exact error directly to the web page UI
    feedContainer.innerHTML = `<p class="small text-danger p-3 fw-bold">${error.message}</p>`;
  }
}

// BULLETPROOF LAUNCHER: Checks if the page is already loaded before waiting for the event
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', fetchGitHubActivity);
} else {
  fetchGitHubActivity();
}