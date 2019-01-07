__ = require('config').universalPath
_ = __.require 'builders', 'utils'
error_ = __.require 'lib', 'error/error'
responses_ = __.require 'lib', 'responses'
sanitize = __.require 'lib', 'sanitize/sanitize'
verifyThatEntitiesCanBeRemoved = require './lib/verify_that_entities_can_be_removed'
removeEntitiesByInvId = require './lib/remove_entities_by_inv_id'

sanitization =
  uris: {}

module.exports = (req, res, next)->
  sanitize req, res, sanitization
  .then (params)->
    { user } = req
    { uris } = params
    console.log('uris', uris)
    uris = _.uniq uris

    for uri in uris
      # Wikidata entities can't be delete
      # and neither can editions entities with an ISBN: they should be fixed
      unless _.isInvEntityUri uri
        throw error_.newInvalid 'uri', uri

    verifyThatEntitiesCanBeRemoved uris
    .then -> removeEntitiesByInvId user, uris
  .then responses_.Ok(res)
  .catch error_.Handler(req, res)
