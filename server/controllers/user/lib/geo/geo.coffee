CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
db = __.require('level', 'geo')('geo')
promises_ = __.require 'lib', 'promises'

module.exports = ->
  # Start following for changes
  require('./follow')(db)

  return API =
    search: (latLng, kmRange)-> db.search latLng, kmRange
