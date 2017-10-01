CONFIG = require 'config'
{ mutedDomains, mutedPath } = CONFIG.morgan
pass = require './pass'
morgan = require 'morgan'

# Using morgan 1.1.1 to be able to have grey request logs
module.exports = morgan
  format: 'dev'
  skip: (req, res)->
    # /!\ resources behind the /public endpoint will have their pathname
    # with /public removed: /public/css/app.css will have a pathname=/css/app.css
    # Take the pathname on (req._parsedOriginalUrl or req._parsedUrl) instead
    # to work around it, if the need arise
    { path, pathname } = req._parsedUrl
    domain = pathname.split('/')[2]
    return domain in mutedDomains or path in mutedPath
