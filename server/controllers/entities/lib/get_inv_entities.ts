import { difference } from 'lodash-es'
import { getEntitiesByIds } from '#controllers/entities/lib/entities'
import type { EntitiesGetterParams } from '#controllers/entities/lib/get_entities_by_uris'
import { getEntityByUri } from '#controllers/entities/lib/get_entity_by_uri'
import { simplifyInvClaims } from '#controllers/entities/lib/inv_claims_utils'
import { prefixifyInv, unprefixify } from '#controllers/entities/lib/prefix'
import type { EntityRedirection, InvEntityDoc, InvEntityId, InvEntityUri, SerializedEntity, SerializedInvEntity, SerializedRemovedPlaceholder } from '#types/entity'
import { formatEntityCommon } from './format_entity_common.js'
import { getEntityType } from './get_entity_type.js'
import { getInvEntityCanonicalUriAndRedirection } from './get_inv_entity_canonical_uri.js'

// Hypothesis: there is no need to look for Wikidata data here
// as inv entities with an associated Wikidata entity use the Wikidata uri
export async function getInvEntitiesByIds (ids: InvEntityId[], params: EntitiesGetterParams) {
  const entities = await getEntitiesByIds(ids)
  const serializedEntities = await Promise.all(entities.map(entity => format(entity, params)))
  const found: InvEntityId[] = serializedEntities.reduce(aggregateFoundIds, [])
  const notFound: InvEntityUri[] = difference(ids, found).map(prefixifyInv)
  return { entities: serializedEntities, notFound }
}

async function format (entity: InvEntityDoc, params: EntitiesGetterParams) {
  if ('redirect' in entity) return getRedirectedEntity(entity, params)

  const [ uri, redirects ] = getInvEntityCanonicalUriAndRedirection(entity)

  const simplifiedClaims = simplifyInvClaims(entity.claims, { keepReferences: params.includeReferences })

  const serializedEntity = {
    uri,
    ...entity,
    type: getEntityType(simplifiedClaims['wdt:P31']),
    claims: simplifiedClaims,
    redirects,
    // Keep track of special types such as removed:placehoder
    // to the let the search engine unindex it
    _meta_type: entity.type !== 'entity' ? entity.type : undefined,
  }

  if (serializedEntity._meta_type === 'removed:placeholder') {
    formatEntityCommon(serializedEntity)
    return serializedEntity as SerializedRemovedPlaceholder
  } else {
    formatEntityCommon(serializedEntity)
    // @ts-expect-error
    return serializedEntity as SerializedInvEntity
  }
}

async function getRedirectedEntity (entity: EntityRedirection, params: EntitiesGetterParams): Promise<SerializedEntity> {
  const { refresh, dry } = params
  const fromUri = prefixifyInv(entity._id)
  // Passing the parameters as the entity data source might be Wikidata
  const redirectionTargetEntity: SerializedEntity = await getEntityByUri({ uri: entity.redirect, refresh, dry })
  redirectionTargetEntity.redirects = { from: fromUri, to: redirectionTargetEntity.uri }
  return redirectionTargetEntity
}

function aggregateFoundIds (foundIds, entity) {
  const { _id, redirects } = entity
  // Won't be true if the entity redirected to a Wikidata entity
  if (_id != null) foundIds.push(_id)
  if (redirects != null) foundIds.push(unprefixify(redirects.from))
  return foundIds
}
