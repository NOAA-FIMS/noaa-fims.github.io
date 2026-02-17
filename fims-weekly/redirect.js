(function() {
  // Extract filename from current URL path
  var path = window.location.pathname;
  var filename = path.substring(path.lastIndexOf('/') + 1);
  
  // Construct new blog path
  var newPath = '/blog/' + filename;
  
  // Handle index.html case - redirect to blog category page
  if (filename === 'index.html' || filename === '') {
    newPath = '/blog/#category=fims-weekly';
  }
  
  // Perform redirect
  window.location.replace(newPath);
})();
