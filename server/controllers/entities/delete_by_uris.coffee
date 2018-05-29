__ = require('config').universalPath
_ = __.require 'builders', 'utils'
error_ = __.require 'lib', 'error/error'
responses_ = __.require 'lib', 'responses'
verifyThatEntitiesCanBeRemoved = require './lib/verify_that_entities_can_be_removed'
removeEntitiesByInvId = require './lib/remove_entities_by_inv_id'

module.exports = (req, res, next)->
  { user } = req
  { uris } = req.query

  unless _.isNonEmptyString uris
    return error_.bundleMissingQuery req, res, 'uris'

  uris = _.uniq uris.split('|')

  for uri in uris
    # Wikidata entities can't be delete obviously
    # and neither can editions entities with an ISBN: they should be fixed
    unless _.isInvEntityUri uri
      return error_.bundleInvalid req, res, 'uri', uri

  verifyThatEntitiesCanBeRemoved uris
  .then -> removeEntitiesByInvId user, uris
  .then responses_.Ok(res)
  .catch error_.Handler(req, res)
