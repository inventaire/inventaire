CONFIG = require 'config'
{ logFormat, mutedRoutes, mutedDomains } = CONFIG.morgan
pass = require './pass'
morgan = require 'morgan'

module.exports = morgan 'dev',
  format: logFormat
  skip: (req, res)->
    # /!\ resources behind the /public endpoint will have their pathname
    # with /public removed: /public/css/app.css will have a pathname=/css/app.css
    # Take the pathname on (req._parsedOriginalUrl or req._parsedUrl) instead
    # to work around it, if the need arise
    { pathname } = req._parsedUrl
    domain = pathname.split('/')[1]
    return domain in mutedDomains or pathname in mutedRoutes
