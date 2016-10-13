CONFIG = require 'config'
__ = CONFIG.universalPath
entities_ = require './entities'
requestGrouper = __.require 'lib', 'request_grouper'

# Get entities by batches but return per-entity promises
# Batches correspond to all requests made within a 5ms window
module.exports = requestGrouper
  requester: entities_.byWikidataIds
  delay: 5
