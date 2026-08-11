;(function () {
  var path = window.location.pathname || ''
  var segment = path.slice(path.lastIndexOf('/') + 1)
  var looksLikeFile = segment && /\.[a-z0-9]+$/i.test(segment)
  if (path.length > 1 && !looksLikeFile && path !== '/index.html') {
    sessionStorage.setItem('ntlo_spa_redirect', path + window.location.search)
    window.location.replace('/')
  }
})()
