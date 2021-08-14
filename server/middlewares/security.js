const enableCorsOnPublicApiRoutes = (req, res, next) => {
  // Only have cross domain requests wide open for GET requests
  // to avoid CSRF on request altering the database
  if (req.method === 'GET') {
    res.header('access-control-allow-origin', '*')
    res.header('access-control-allow-methods', 'GET')
    res.header('access-control-allow-headers', 'content-type')
  } else {
    res.header('access-control-allow-origin', 'https://api.inventaire.io')
    res.header('access-control-allow-methods', 'GET,POST,PUT')
    res.header('access-control-allow-credentials', 'true')
  }

  next()
}

module.exports = { enableCorsOnPublicApiRoutes }
