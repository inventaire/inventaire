CONFIG = require 'config'
pass = require './pass'

# Applies to both API and static files requests
if CONFIG.noCache
  exports.cacheControl = (req, res, next) ->
    res.header 'Cache-Control', 'no-cache, no-store, must-revalidate'
    next()
else
  exports.cacheControl = pass
