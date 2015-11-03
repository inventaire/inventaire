CONFIG = require 'config'
__ = CONFIG.root
_ = __.require 'builders', 'utils'
couch_ = __.require 'lib', 'couch'

module.exports = (db)->
  return byPosition = (latLng)->
    _.types latLng, 'numbers...'

    # fake query returning all users with a position
    # waiting for the real byPosition implementation
    # relying on latLng for filtering
    db.view 'user', 'byPosition', { include_docs: true }
    .then couch_.mapDoc
