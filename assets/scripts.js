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
<script>
async function fetchGitHubActivity() {
  const owner = 'noaa-fims'; // Replace with your org/user
  const repo = 'fims';       // Replace with your repo
  const feedContainer = document.getElementById('github-activity-feed');

  try {
    // Fetch the latest events from the repository
    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/events?per_page=10`);
    if (!response.ok) throw new Error('Network response was not ok');
    
    const events = await response.json();
    
    // Filter for Pull Requests and Pushes
    const relevantEvents = events.filter(event => 
      event.type === 'PullRequestEvent' || event.type === 'PushEvent'
    ).slice(0, 3); // Get the top 3

    feedContainer.innerHTML = ''; // Clear the loading state or hardcoded html

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

      // Calculate time ago
      const date = new Date(event.created_at);
      const diffHours = Math.floor((new Date() - date) / (1000 * 60 * 60));
      const timeAgo = diffHours > 24 ? `${Math.floor(diffHours/24)}d ago` : `${diffHours}h ago`;

      // Construct the HTML snippet
      const eventHTML = `
        <div class="flex items-start gap-4 p-4 rounded-xl hover:bg-surface-container-low transition-colors border border-transparent hover:border-outline-variant">
          <div class="w-10 h-10 rounded-full bg-surface-dim overflow-hidden flex-shrink-0">
            <img src="${event.actor.avatar_url}" alt="${event.actor.display_login}" />
          </div>
          <div class="flex-1">
            <p class="text-sm font-medium"><span class="text-primary font-bold">${event.actor.display_login}</span> ${actionText} <span class="text-accent-red font-code-base font-bold">${branchName}</span></p>
            <p class="text-xs text-on-surface-variant mt-1 italic">"${detailText}"</p>
          </div>
          <span class="text-[10px] text-on-surface-variant font-medium">${timeAgo}</span>
        </div>
      `;
      feedContainer.insertAdjacentHTML('beforeend', eventHTML);
    });

  } catch (error) {
    console.error('Error fetching GitHub activity:', error);
    feedContainer.innerHTML = '<p class="text-sm text-on-surface-variant p-4">Unable to load recent activity.</p>';
  }
}

// Run the function when the DOM is ready
document.addEventListener('DOMContentLoaded', fetchGitHubActivity);
</script>