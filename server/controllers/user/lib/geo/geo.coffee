CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
db = __.require('level', 'geo')('geo')
promises_ = __.require 'lib', 'promises'
startFollowing = -> require('./follow')(db, CONFIG.db.resetFollow)

module.exports = ->
  # Wait for couchdb initialization to be done
  # or it might not find the database
  setTimeout startFollowing, 5000

  return API =
    search: (latLng, kmRange)-> db.search latLng, kmRange
