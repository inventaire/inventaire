CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
{ invHost } = CONFIG
devEnv = CONFIG.env is 'dev'

exports.enableCorsOnPublicApiRoutes = (req, res, next)->
  # Only have cross domain requests wide open for public routes
  # to avoid CSRF on request altering the database
  if req.isPublicRoute
    res.header 'Access-Control-Allow-Origin', '*'
    res.header 'Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE'
    res.header 'Access-Control-Allow-Headers', 'Content-Type'
  next()

altHost = if CONFIG.host isnt invHost then invHost else ''
# In development, brunch needs websockets to be whitelisted
ws = if devEnv then 'ws:' else ''

# Keep in sync with nginx/inventaire.original.nginx@inventaire/inventaire-deploy
policy = "default-src 'self' #{ws};" +
  "child-src 'self' blob:;" +
  # 'unsafe-inline': required by
  #   - <script>require('initialize')</script>
  #   - login form 'onclick'
  #   - dynamically loaded scripts(?)
  "script-src 'self' 'unsafe-inline';" +
  # 'unsafe-inline': required by _.preq.getCss and Modernizr
  "style-src 'self' 'unsafe-inline';" +
  "font-src 'self';" +
  # altHost: required for images taken directly on the main server
  # data: required by leaflet and cropper
  # https://commons.wikimedia.org: used for image claims
  "img-src 'self' #{altHost} https://commons.wikimedia.org https://api.tiles.mapbox.com data:;" +
  "report-uri /api/reports/public?action=csp-report;"

exports.addSecurityHeaders = (req, res, next) ->
  res.header 'X-XSS-Protection', '1; mode=block; report-uri=/api/reports/public?action=csp-report;'
  res.header 'X-Frame-Options', 'SAMEORIGIN'
  res.header 'Content-Security-Policy', policy
  res.header 'X-Content-Security-Policy', policy
  res.header 'X-WebKit-CSP', policy

  unless devEnv
    # Development is made over HTTP
    res.header 'Strict-Transport-Security', 'max-age=31536000'

  next()
