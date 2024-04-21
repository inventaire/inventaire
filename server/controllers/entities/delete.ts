import { uniq } from 'lodash-es'
import { getInvEntitiesByIsbns } from '#controllers/entities/lib/entities'
import { isInvEntityUri, isIsbnEntityUri, isWdEntityUri } from '#lib/boolean_validations'
import { newInvalidError } from '#lib/error/pre_filled'
import removeEntitiesByInvId from './lib/remove_entities_by_inv_id.js'
import verifyThatEntitiesCanBeRemoved from './lib/verify_that_entities_can_be_removed.js'

const sanitization = {
  uris: {},
}

async function controller (params, req) {
  const { user } = req
  let uris = uniq(params.uris)
  validateUris(uris)
  uris = await replaceIsbnUrisByInvUris(uris)
  await verifyThatEntitiesCanBeRemoved(uris)
  await removeEntitiesByInvId(user, uris)
  return { ok: true }
}

function validateUris (uris) {
  for (const uri of uris) {
    // Wikidata entities can't be delete
    if (isWdEntityUri(uri)) throw newInvalidError('uri', uri)
  }
}

async function replaceIsbnUrisByInvUris (uris) {
  const invUris = uris.filter(isInvEntityUri)
  const isbnUris = uris.filter(isIsbnEntityUri)
  if (isbnUris.length === 0) return invUris

  const substitutedUris = await getInvUrisFromIsbnUris(isbnUris)
  return invUris.concat(substitutedUris)
}

async function getInvUrisFromIsbnUris (uris) {
  const isbns = uris.map(uri => uri.split(':')[1])
  const entities = await getInvEntitiesByIsbns(isbns)
  return entities.map(entity => `inv:${entity._id}`)
}

export default { sanitization, controller }
