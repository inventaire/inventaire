CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'

module.exports =
  legacyApiRedirect: (req, res, next)->
    parts = req._parsedUrl.pathname.split('/')
    if parts[3] is 'public'
      rewroteUrl = req.url.replace '/public', ''
      res.redirect rewroteUrl
    else
      next()
