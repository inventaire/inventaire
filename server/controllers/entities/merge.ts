import { isIsbnEntityUri } from '#lib/boolean_validations'
import { newError } from '#lib/error/error'
import { emit } from '#lib/radio'
import { log } from '#lib/utils/logs'
import type { EntityUri, SerializedEntity } from '#types/entity'
import { getEntitiesByUris } from './lib/get_entities_by_uris.js'
import mergeEntities from './lib/merge_entities.js'

const sanitization = {
  from: {},
  to: {},
}

// Assumptions:
// - ISBN are already desambiguated and should thus never need merge
//   out of the case of merging with an existing Wikidata edition entity
//   but those are ignored for the moment (see https://github.com/inventaire/inventaire/issues/182)
// - The merged entity data may be lost: the entity was probably a placeholder
//   what matters the most is the redirection. Finer reconciling strategy could be developed later

// Only inv entities can be merged yet
const validFromUriPrefix = [ 'inv', 'isbn' ]

async function controller (params) {
  const { reqUserId } = params
  let { from: fromUri, to: toUri } = params
  const [ fromPrefix ] = fromUri.split(':')

  if (!validFromUriPrefix.includes(fromPrefix)) {
    // 'to' prefix doesn't need validation as it can be anything
    const message = `invalid 'from' uri domain: ${fromPrefix}. Accepted domains: ${validFromUriPrefix}`
    throw newError(message, 400, params)
  }

  log({ merge: params, user: reqUserId }, 'entity merge request')

  const { fromEntity, toEntity } = await getMergeEntities(fromUri, toUri)
  validateEntities({ fromUri, toUri, fromEntity, toEntity })
  validateEntitiesByType({ fromEntity, toEntity })

  fromUri = replaceIsbnUriByInvUri(fromUri, fromEntity)
  toUri = replaceIsbnUriByInvUri(toUri, toEntity)

  await mergeEntities({ userId: reqUserId, fromUri, toUri })
  await emit('entity:merge', fromUri, toUri)
  return { ok: true }
}

async function getMergeEntities (fromUri: EntityUri, toUri: EntityUri) {
  const { entities, redirects } = await getEntitiesByUris({ uris: [ fromUri, toUri ], refresh: true })
  const fromEntity = getMergeEntity(entities, redirects, fromUri)
  const toEntity = getMergeEntity(entities, redirects, toUri)
  return { fromEntity, toEntity }
}

function getMergeEntity (entities, redirects, uri) {
  return (entities[uri] || entities[redirects[uri]]) as (SerializedEntity | undefined)
}

function validateEntities ({ fromUri, toUri, fromEntity, toEntity }: { fromUri: EntityUri, toUri: EntityUri, fromEntity: Entity, toEntity }) {
  validateEntity(fromEntity, fromUri, 'from')
  validateEntity(toEntity, toUri, 'to')
  if (fromEntity.uri === toEntity.uri) {
    throw newError("can't merge an entity into itself", 400, { fromUri, toUri })
  }
}

function validateEntity (entity, originalUri, label) {
  if (entity == null) {
    throw newError(`'${label}' entity not found`, 400, originalUri)
  }
  if (entity.uri !== originalUri && `inv:${entity._id}` !== originalUri) {
    throw newError(`'${label}' entity is already a redirection`, 400, { entity, originalUri })
  }
}

function validateEntitiesByType ({ fromEntity, toEntity }) {
  const { uri: fromUri } = fromEntity
  const { uri: toUri } = toEntity

  if (fromEntity.type !== toEntity.type) {
    // Exception: authors can be organizations and collectives of all kinds
    // which will not get a 'human' type
    if ((fromEntity.type !== 'human') || !(toEntity.type == null)) {
      const message = `type don't match: ${fromEntity.type} / ${toEntity.type}`
      throw newError(message, 400, { fromUri, toUri })
    }
  }

  // Merging editions with ISBNs should only happen in the rare case
  // where the uniqueness check failed because two entities with the same ISBN
  // were created at about the same time. Other cases should be rejected.
  if (fromEntity.type === 'edition') {
    const fromEntityIsbn = fromEntity.claims['wdt:P212'] != null ? fromEntity.claims['wdt:P212'][0] : undefined
    const toEntityIsbn = toEntity.claims['wdt:P212'] != null ? toEntity.claims['wdt:P212'][0] : undefined
    if ((fromEntityIsbn != null) && (toEntityIsbn != null) && (fromEntityIsbn !== toEntityIsbn)) {
      throw newError("can't merge editions with different ISBNs", 400, { fromUri, toUri })
    }
  }
}

function replaceIsbnUriByInvUri (uri, entity) {
  if (isIsbnEntityUri(uri)) {
    const [ prefix ] = uri.split(':')
    // Prefer inv id over isbn to prepare for ./lib/merge_entities
    if (prefix === 'isbn') return `inv:${entity._id}`
  }
  return uri
}

export default { sanitization, controller }
