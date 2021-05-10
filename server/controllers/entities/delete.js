const _ = require('builders/utils')
const error_ = require('lib/error/error')
const responses_ = require('lib/responses')
const sanitize = require('lib/sanitize/sanitize')
const verifyThatEntitiesCanBeRemoved = require('./lib/verify_that_entities_can_be_removed')
const removeEntitiesByInvId = require('./lib/remove_entities_by_inv_id')
const entities_ = require('./lib/entities')

const sanitization = {
  uris: {}
}

module.exports = (req, res) => {
  sanitize(req, res, sanitization)
  .then(deleteEntities(req.user))
  .then(responses_.Ok(res))
  .catch(error_.Handler(req, res))
}

const deleteEntities = user => async params => {
  let uris = _.uniq(params.uris)
  validateUris(uris)
  uris = await replaceIsbnUrisByInvUris(uris)
  await verifyThatEntitiesCanBeRemoved(uris)
  return removeEntitiesByInvId(user, uris)
}

const validateUris = uris => {
  for (const uri of uris) {
    // Wikidata entities can't be delete
    if (_.isWdEntityUri(uri)) throw error_.newInvalid('uri', uri)
  }
}

const replaceIsbnUrisByInvUris = async uris => {
  const invUris = uris.filter(_.isInvEntityUri)
  const isbnUris = uris.filter(_.isIsbnEntityUri)
  if (isbnUris.length === 0) return invUris

  const substitutedUris = await getInvUrisFromIsbnUris(isbnUris)
  return invUris.concat(substitutedUris)
}

const getInvUrisFromIsbnUris = async uris => {
  const isbns = uris.map(uri => uri.split(':')[1])
  const entities = await entities_.byIsbns(isbns)
  return entities.map(entity => `inv:${entity._id}`)
}
