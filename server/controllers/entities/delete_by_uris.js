// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const __ = require('config').universalPath
const _ = __.require('builders', 'utils')
const error_ = __.require('lib', 'error/error')
const responses_ = __.require('lib', 'responses')
const sanitize = __.require('lib', 'sanitize/sanitize')
const verifyThatEntitiesCanBeRemoved = require('./lib/verify_that_entities_can_be_removed')
const removeEntitiesByInvId = require('./lib/remove_entities_by_inv_id')

const sanitization = {
  uris: {}
}

module.exports = (req, res, next) => {
  sanitize(req, res, sanitization)
  .then(params => {
    const { user } = req
    const uris = _.uniq(params.uris)
    validateInvUris(uris)
    return verifyThatEntitiesCanBeRemoved(uris)
    .then(() => removeEntitiesByInvId(user, uris))
  })
  .then(responses_.Ok(res))
  .catch(error_.Handler(req, res))
}

const validateInvUris = uris => {
  for (const uri of uris) {
    // Wikidata entities can't be delete
    // and neither can editions entities with an ISBN: they should be fixed
    if (!_.isInvEntityUri(uri)) {
      throw error_.newInvalid('uri', uri)
    }
  }
}
