// Hardened JavaScript for GitHub Recent Activity Feed
(async function initGitHubFeed() {
  // Direct execution block ensures this runs immediately without waiting on state changes
  const feedContainer = document.getElementById('github-activity-feed');
  if (!feedContainer) {
    console.warn("FIMS Feed Warning: Target element '#github-activity-feed' not found in DOM.");
    return;
  }

  const owner = 'noaa-fims'; 
  const repo = 'fims';       

  try {
    feedContainer.innerHTML = '<span class="text-primary fst-italic small">Attempting to contact GitHub...</span>';
    
    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/events?per_page=30`);
    
    if (!response.ok) {
      throw new Error(`GitHub Api Error: ${response.status} ${response.statusText}`);
    }
    
    const events = await response.json();
    
    // Isolate Push and PR actions
    const allRelevantEvents = events.filter(event => 
      event.type === 'PullRequestEvent' || event.type === 'PushEvent'
    );

    if (!allRelevantEvents || allRelevantEvents.length === 0) {
       feedContainer.innerHTML = '<span class="text-muted small">No recent repository activity found.</span>';
       return;
    }

    // Evaluate against a relative 3-day time window
    const threeDaysAgo = new Date(Date.now() - (3 * 24 * 60 * 60 * 1000));
    let displayEvents = allRelevantEvents.filter(event => new Date(event.created_at) >= threeDaysAgo);
    
    let noticeHTML = '';
    
    // Smart Fallback: If past 3 days are empty, fallback to last 3 available events
    if (displayEvents.length === 0) {
      displayEvents = allRelevantEvents.slice(0, 3);
      noticeHTML = '<div class="px-3 pb-2 text-muted fst-italic" style="font-size: 0.8rem;">No activity in the last 3 days. Showing latest updates:</div>';
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
        detailText = event.payload.pull_request?.title || 'No title provided';
        branchName = `#${event.payload.number}`;
      } else if (event.type === 'PushEvent') {
        const commits = event.payload.commits || []; 
        const commitCount = commits.length;
        
        actionText = `pushed ${commitCount} commit${commitCount !== 1 ? 's' : ''} to`;
        detailText = commits[0]?.message || 'Branch update / No commit message';
        branchName = event.payload.ref ? event.payload.ref.replace('refs/heads/', '') : 'main';
      }

      const date = new Date(event.created_at);
      const diffHours = Math.floor((new Date() - date) / (1000 * 60 * 60));
      let timeAgo = '';
      
      if (diffHours < 1) {
        timeAgo = 'Just now';
      } else if (diffHours < 24) {
        timeAgo = `${diffHours}h ago`;
      } else {
        timeAgo = `${Math.floor(diffHours / 24)}d ago`;
      }

      // Safe clean bootstrap layout classes used exclusively
      const eventHTML = `
        <div class="d-flex align-items-start gap-3 p-3 rounded-3 border border-transparent transition-colors" style="background-color: rgba(0,0,0,0.02);">
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
    console.error("FIMS Feed Runtime Error:", error);
    feedContainer.innerHTML = `<p class="small text-danger p-3 fw-bold">Unable to sync activity: ${error.message}</p>`;
  }
})();