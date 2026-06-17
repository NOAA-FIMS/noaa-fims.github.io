(function() {
  var origin = 'https://noaa-fims.github.io';
  var path = window.location.pathname;
  var filename = path.substring(path.lastIndexOf('/') + 1);

  var newUrl = origin + '/blog/' + filename;

  if (filename === 'index.html' || filename === '') {
    newUrl = origin + '/blog/#category=fims-weekly';
  }

  window.location.replace(newUrl);
})();
