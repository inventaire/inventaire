import { compact, difference } from 'lodash-es'
import { getEntitiesByIds } from '#controllers/entities/lib/entities'
import type { EntitiesGetterParams } from '#controllers/entities/lib/get_entities_by_uris'
import { getEntityByUri } from '#controllers/entities/lib/get_entity_by_uri'
import { getFirstClaimValue, simplifyInvClaims } from '#controllers/entities/lib/inv_claims_utils'
import { prefixifyInv, unprefixify } from '#controllers/entities/lib/prefix'
import { isWdEntityUri } from '#lib/boolean_validations'
import { newError } from '#lib/error/error'
import { warn } from '#lib/utils/logs'
import type { EntityRedirection, InvEntityDoc, InvEntityId, InvEntityUri, SerializedEntity, SerializedInvEntity, SerializedRemovedPlaceholder, EntityUri, InvEntity } from '#types/entity'
import { formatInvEntityCommon } from './format_inv_entity_common.js'
import { getInvEntityType } from './get_entity_type.js'
import { getInvEntityCanonicalUriAndRedirection } from './get_inv_entity_canonical_uri.js'

// Hypothesis: there is no need to look for Wikidata data here
// as inv entities with an associated Wikidata entity use the Wikidata uri
export async function getInvEntitiesByIds (ids: InvEntityId[], params: EntitiesGetterParams) {
  const entities = await getEntitiesByIds(ids)
  const serializedEntities = await Promise.all(entities.map(entity => format(entity, params)))
  const foundEntities = compact(serializedEntities)
  const found: InvEntityId[] = foundEntities.reduce(aggregateFoundIds, [])
  const notFound: InvEntityUri[] = difference(ids, found).map(prefixifyInv)
  return { entities: foundEntities, notFound }
}

async function format (entity: InvEntityDoc, params: EntitiesGetterParams) {
  if ('redirect' in entity) return getRemoteEntity(entity.redirect, entity, params)

  const remoteEntityUri = getFirstClaimValue(entity.claims, 'invp:P1')
  if (remoteEntityUri && entity.type === 'entity') return getRemoteEntity(remoteEntityUri, entity, params)

  const [ uri, redirects ] = getInvEntityCanonicalUriAndRedirection(entity)

  // Narrowing down uri type: remote entity uris will have returned with redirectToRemoteEntity
  if (isWdEntityUri(uri)) throw newError('unexpected remote uri', 500, { entity, uri })

  const simplifiedClaims = simplifyInvClaims(entity.claims, { keepReferences: params.includeReferences })

  const serializedEntity = {
    uri,
    ...entity,
    type: getInvEntityType(simplifiedClaims['wdt:P31']),
    claims: simplifiedClaims,
    redirects,
    // Keep track of special types such as removed:placehoder
    // to the let the search engine unindex it
    _meta_type: entity.type !== 'entity' ? entity.type : undefined,
  }

  if (serializedEntity._meta_type === 'removed:placeholder') {
    // @ts-expect-error
    return formatInvEntityCommon(serializedEntity) as SerializedRemovedPlaceholder
  } else {
    // @ts-expect-error
    return formatInvEntityCommon(serializedEntity) as SerializedInvEntity
  }
}

async function getRemoteEntity (remoteEntityUri: EntityUri, entity: InvEntity | EntityRedirection, params: EntitiesGetterParams) {
  const { refresh, dry } = params
  const fromUri = prefixifyInv(entity._id)
  const remoteEntity: SerializedEntity = await getEntityByUri({ uri: remoteEntityUri, refresh, dry })
  if (remoteEntity) {
    remoteEntity.redirects = { from: fromUri, to: remoteEntity.uri }
    return remoteEntity
  } else {
    // Case where the remote entity has been deleted
    warn({ entity, remoteEntityUri }, 'cannot get remote entity: remote entity missing')
  }
}

function aggregateFoundIds (foundIds, entity) {
  const { _id, redirects } = entity
  // Won't be true if the entity redirected to a Wikidata entity
  if (_id != null) foundIds.push(_id)
  if (redirects != null) foundIds.push(unprefixify(redirects.from))
  return foundIds
}
