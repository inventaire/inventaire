import { partition, uniq } from 'lodash-es'
import { getInvEntitiesByIsbns } from '#controllers/entities/lib/entities'
import { isInvEntityUri, isWdEntityUri } from '#lib/boolean_validations'
import { newInvalidError } from '#lib/error/pre_filled'
import type { EntityUri, InvEntityUri, IsbnEntityUri } from '#server/types/entity'
import { removeEntitiesByInvId } from './lib/remove_entities_by_inv_id.js'
import { verifyThatEntitiesCanBeRemoved } from './lib/verify_that_entities_can_be_removed.js'

const sanitization = {
  uris: {},
}

async function controller (params, req) {
  const { user } = req
  const uris = uniq(params.uris) as EntityUri[]
  validateUris(uris)
  const invUris: InvEntityUri[] = await replaceIsbnUrisByInvUris(uris)
  await verifyThatEntitiesCanBeRemoved(invUris)
  await removeEntitiesByInvId(user, invUris)
  return { ok: true }
}

function validateUris (uris: EntityUri[]): asserts uris is (InvEntityUri | IsbnEntityUri)[] {
  for (const uri of uris) {
    // Wikidata entities can't be delete
    if (isWdEntityUri(uri)) throw newInvalidError('uri', uri)
  }
}

async function replaceIsbnUrisByInvUris (uris: (InvEntityUri | IsbnEntityUri)[]) {
  const [ invUris, isbnUris ] = partition(uris, isInvEntityUri) as [ InvEntityUri[], IsbnEntityUri[] ]
  if (isbnUris.length === 0) return invUris

  const substitutedUris = await getInvUrisFromIsbnUris(isbnUris)
  return [ ...invUris, ...substitutedUris ] as InvEntityUri[]
}

async function getInvUrisFromIsbnUris (uris: IsbnEntityUri[]) {
  const isbns = uris.map(uri => uri.split(':')[1])
  const entities = await getInvEntitiesByIsbns(isbns)
  return entities.map(entity => `inv:${entity._id}`)
}

export default { sanitization, controller }
