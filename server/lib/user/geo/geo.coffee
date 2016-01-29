CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
db = __.require('level', 'geo')('geo')
promises_ = __.require 'lib', 'promises'


module.exports = (reset)->

  require('./follow')(db, reset)

  API =
    search: (latLng, kmRange)->
      db.search latLng, kmRange
      .then _.Log('search results')
