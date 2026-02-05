(function() {
    var currentPath = window.location.pathname;
    var filename = currentPath.split('/').pop();
    
    if (filename === '' || filename === 'index.html') {
        window.location.href = '/blog/#category=fims-weekly';
    } else {
        window.location.href = '/blog/' + filename;
    }
})();
