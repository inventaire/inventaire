import _ from '#builders/utils'
import error_ from '#lib/error/error'
import verifyThatEntitiesCanBeRemoved from './lib/verify_that_entities_can_be_removed.js'
import removeEntitiesByInvId from './lib/remove_entities_by_inv_id.js'
import entities_ from './lib/entities.js'

const sanitization = {
  uris: {}
}

const controller = async (params, req) => {
  const { user } = req
  let uris = _.uniq(params.uris)
  validateUris(uris)
  uris = await replaceIsbnUrisByInvUris(uris)
  await verifyThatEntitiesCanBeRemoved(uris)
  await removeEntitiesByInvId(user, uris)
  return { ok: true }
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

export default { sanitization, controller }
