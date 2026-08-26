// JavaScript for GitHub Recent Activity Feed
async function fetchGitHubActivity() {
  const feedContainer = document.getElementById('github-activity-feed');
  if (!feedContainer) return;

  const owner = 'noaa-fims'; 
  const repo = 'fims';       

  try {
    feedContainer.innerHTML = '<span class="text-primary fst-italic small">Attempting to contact GitHub...</span>';
    
    // MAXED OUT PARAMETER: Requesting 100 events to dig past bot/issue activity noise
    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/events?per_page=100`);
    
    if (!response.ok) {
      throw new Error(`GitHub Error: ${response.status} ${response.statusText}`);
    }
    
    const events = await response.json();
    
    // Extract all Push and PR events from the large log
    const allRelevantEvents = events.filter(event => 
      event.type === 'PullRequestEvent' || event.type === 'PushEvent'
    );

    // If even within 100 events there's no code activity, look for a standard fallback
    if (allRelevantEvents.length === 0) {
       feedContainer.innerHTML = '<span class="text-muted small">No code pushes or PR updates found in recent history.</span>';
       return;
    }

    // Calculate our 3-day cutoff window in milliseconds
    const threeDaysAgoMs = Date.now() - (3 * 24 * 60 * 60 * 1000);
    
    // Filter for events strictly inside the 3-day window
    let displayEvents = allRelevantEvents.filter(event => Date.parse(event.created_at) >= threeDaysAgoMs);
    
    let noticeHTML = '';
    
    // SMART FALLBACK: If the past 3 days have been quiet, show the last 3 overall events instead
    if (displayEvents.length === 0) {
      displayEvents = allRelevantEvents.slice(0, 3);
      noticeHTML = '<div class="px-3 pb-2 text-muted fst-italic" style="font-size: 0.8rem;">No code updates in the last 3 days. Latest project updates:</div>';
    } else {
      displayEvents = displayEvents.slice(0, 3);
    }

    feedContainer.innerHTML = noticeHTML; 

    displayEvents.forEach(event => {
      let actionText = '';
      let detailText = '';
      let branchName = '';

      if (event.type === 'PullRequestEvent') {
        actionText = `${event.payload.action} pull request`;
        detailText = event.payload.pull_request.title;
        branchName = `#${event.payload.number}`;
      } else if (event.type === 'PushEvent') {
        const commits = event.payload.commits || []; 
        const commitCount = commits.length;
        
        actionText = `pushed ${commitCount} commit${commitCount !== 1 ? 's' : ''} to`;
        detailText = commits[0]?.message || 'Branch update / No commit message';
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
          <span class="text-muted fw-medium" style="font-size: 0.7rem; white-space: nowrap;">${timeAgo}</span>
        </div>
      `;
      feedContainer.insertAdjacentHTML('beforeend', eventHTML);
    });

  } catch (error) {
    console.error(error);
    feedContainer.innerHTML = `<p class="small text-danger p-3 fw-bold">${error.message}</p>`;
  }
}

function updateNextMeetingTime() {
  // NOTE: This function assumes the meeting is on the third Wednesday of every month at 1:00 PM US Eastern Time.
  // It also assumes the page contains elements with id="next-meeting-date" and id="next-meeting-time" to display the calculated values.
  const dateElement = document.getElementById('next-meeting-date');
  const timeElement = document.getElementById('next-meeting-time');

  if (!dateElement || !timeElement) {
    // Don't show an error if the elements aren't on the page.
    return;
  }

  const getThirdWednesday = (year, month) => {
    // Create a date for the first day of the given month in UTC
    const d = new Date(Date.UTC(year, month, 1));
    // Find the day of the week for the 1st of the month (0=Sun, 1=Mon, ..., 3=Wed)
    const firstDay = d.getUTCDay();
    // Calculate the date of the first Wednesday
    let dayOfMonth = 1 + (3 - firstDay + 7) % 7;
    // Add 14 days to get the third Wednesday
    dayOfMonth += 14;
    d.setUTCDate(dayOfMonth);
    return d;
  };

  const now = new Date();
  let meetingDate = getThirdWednesday(now.getUTCFullYear(), now.getUTCMonth());

  // Create a date for today (at midnight UTC) for comparison
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  if (meetingDate < today) {
    // If this month's meeting has passed, get next month's meeting
    meetingDate = getThirdWednesday(now.getUTCFullYear(), now.getUTCMonth() + 1);
  }

  const dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' };
  dateElement.textContent = meetingDate.toLocaleDateString('en-US', dateOptions);

  // Displaying time explicitly as a string to avoid timezone conversion errors in the browser.
  // This fixes the "00:00 EDT" issue and ensures the time is always correct.
  timeElement.textContent = '1:00 PM US Eastern Time';
}

function hideDecorativeSidebarIcons() {
  document.querySelectorAll('.quarto-sidebar i[role="img"]').forEach(icon => {
    icon.setAttribute('aria-hidden', 'true');
  });
}

document.addEventListener('DOMContentLoaded', () => {
  hideDecorativeSidebarIcons();
  fetchGitHubActivity();
  updateNextMeetingTime();
});