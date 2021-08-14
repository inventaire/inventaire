const enableCorsOnPublicApiRoutes = (req, res, next) => {
  res.header('access-control-allow-origin', '*')
  res.header('access-control-allow-methods', '*')
  res.header('access-control-allow-headers', 'content-type')
  // Recommend browsers to not send cookies, to prevent CSRF on endpoints requiring authentification
  res.header('access-control-allow-credentials', 'false')

  if (req.method === 'OPTIONS') {
    // The headers above is all preflight requests should need
    // See https://developer.mozilla.org/en-US/docs/Glossary/Preflight_request
    res.end()
  } else {
    next()
  }
}

module.exports = { enableCorsOnPublicApiRoutes }
