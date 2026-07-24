;(function () {
  var path = window.location.pathname || ''
  var segment = path.slice(path.lastIndexOf('/') + 1)
  var looksLikeFile = segment && /\.[a-z0-9]+$/i.test(segment)
  if (path.length > 1 && !looksLikeFile) {
    var target = '/#' + path + window.location.search
    if (window.location.hash) target += window.location.hash
    window.location.replace(target)
  }
})()
