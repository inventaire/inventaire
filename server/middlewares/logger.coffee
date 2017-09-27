CONFIG = require 'config'
{ logFormat, mutedRoutes, mutedDomains } = CONFIG.morgan
pass = require './pass'
morgan = require 'morgan'

logger = morgan 'dev',
  format: logFormat
  skip: (req, res)->
    { pathname } = req._parsedUrl
    domain = pathname.split('/')[1]
    # /!\ resources behind the /public endpoint will have their pathname
    # with /public removed: /public/css/app.css will have a pathname=/css/app.css
    return domain in mutedDomains or pathname in mutedRoutes

# Init the logger before the static files middleware to log static files requests
# Has no effect when CONFIG.serveStaticFiles is false notably in production,
# where static files are served by the Nginx server
if CONFIG.logStaticFilesRequests
  [ before, after ] = [ logger, pass ]
else
  [ before, after ] = [ pass, logger ]

module.exports =
  beforeStatic: before
  afterStatic: after
