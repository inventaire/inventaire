__ = require('config').universalPath
_ = __.require 'builders', 'utils'
promises_ = __.require 'lib', 'promises'
redirectClaims = require './redirect_claims'
updateItemEntity = __.require 'controllers', 'items/lib/update_entity'

module.exports = (userId, fromUri, toUri)->
  promises_.all [
    redirectClaims userId, fromUri, toUri
    updateItemEntity.afterMerge fromUri, toUri
  ]
