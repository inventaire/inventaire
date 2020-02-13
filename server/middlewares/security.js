const enableCorsOnPublicApiRoutes = (req, res, next) => {
  // Only have cross domain requests wide open for GET requests
  // to avoid CSRF on request altering the database
  if (req.method === 'GET') {
    res.header('Access-Control-Allow-Origin', '*')
    res.header('Access-Control-Allow-Methods', 'GET')
    res.header('Access-Control-Allow-Headers', 'Content-Type')
  } else {
    res.header('Access-Control-Allow-Origin', 'https://api.inventaire.io')
    res.header('Access-Control-Allow-Methods', 'GET,POST,PUT')
    res.header('Access-Control-Allow-Credentials', 'true')
  }

  next()
}

module.exports = { enableCorsOnPublicApiRoutes }
