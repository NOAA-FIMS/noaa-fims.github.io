// javascript for GitHub recent activity feed
async function fetchGitHubActivity() {
  const feedContainer = document.getElementById('github-activity-feed');
  if (!feedContainer) return;

  const owner = 'noaa-fims'; 
  const repo = 'fims';       

  try {
    feedContainer.innerHTML = '<span class="text-primary fst-italic small">Attempting to contact GitHub...</span>';
    
    // Increased per_page to 30 to make sure we don't miss 2-3 day old events on busy days
    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/events?per_page=30`);
    
    if (!response.ok) {
      throw new Error(`GitHub Error: ${response.status} ${response.statusText}`);
    }
    
    const events = await response.json();
    
    // Calculate our 3-day cutoff window (3 days * 24 hours * 60 mins * 60 secs * 1000 ms)
    const threeDaysAgo = new Date(Date.now() - (3 * 24 * 60 * 60 * 1000));
    
    // Filter events matching both type AND the 3-day age criteria
    const relevantEvents = events.filter(event => {
      const isCorrectType = event.type === 'PullRequestEvent' || event.type === 'PushEvent';
      const isRecentEnough = new Date(event.created_at) >= threeDaysAgo;
      return isCorrectType && isRecentEnough;
    });

    if (relevantEvents.length === 0) {
       feedContainer.innerHTML = '<span class="text-muted small">No recent pushes or PRs found in the last 3 days.</span>';
       return;
    }

    feedContainer.innerHTML = ''; 

    // Loop through filtered events (limit display window to top 3 total items)
    relevantEvents.slice(0, 3).forEach(event => {
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
          <span class="text-muted fw-medium" style="font-size: 0.7rem;">${timeAgo}</span>
        </div>
      `;
      feedContainer.insertAdjacentHTML('beforeend', eventHTML);
    });

  } catch (error) {
    console.error(error);
    feedContainer.innerHTML = `<p class="small text-danger p-3 fw-bold">${error.message}</p>`;
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', fetchGitHubActivity);
} else {
  fetchGitHubActivity();
}