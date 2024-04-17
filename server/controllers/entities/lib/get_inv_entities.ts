import { difference } from 'lodash-es'
import { getEntitiesByIds } from '#controllers/entities/lib/entities'
import type { EntitiesGetterArgs } from '#controllers/entities/lib/get_entities_by_uris'
import { getEntityByUri } from '#controllers/entities/lib/get_entity_by_uri'
import { prefixifyInv, unprefixify } from '#controllers/entities/lib/prefix'
import type { InvEntityDoc, InvEntityId, SerializedInvEntity, SerializedRemovedPlaceholder } from '#types/entity'
import addRedirection from './add_redirection.js'
import formatEntityCommon from './format_entity_common.js'
import getEntityType from './get_entity_type.js'
import getInvEntityCanonicalUri from './get_inv_entity_canonical_uri.js'

// Hypothesis: there is no need to look for Wikidata data here
// as inv entities with an associated Wikidata entity use the Wikidata uri
export async function getInvEntitiesByIds (ids: InvEntityId[], params: EntitiesGetterArgs) {
  let entities = await getEntitiesByIds(ids)
  entities = await Promise.all(entities.map(Format(params)))
  const found = entities.reduce(aggregateFoundIds, [])
  const notFound = difference(ids, found).map(prefixifyInv)
  return { entities, notFound }
}

const Format = (params: EntitiesGetterArgs) => async (entity: InvEntityDoc) => {
  if ('redirect' in entity) return getRedirectedEntity(entity, params)

  const [ uri, redirects ] = getInvEntityCanonicalUri(entity, { includeRedirection: true })
  const serializedEntity = {
    uri,
    ...entity,
    type: getEntityType(entity.claims['wdt:P31']),
    redirects,
    // Keep track of special types such as removed:placehoder
    // to the let the search engine unindex it
    _meta_type: entity.type !== 'entity' ? entity.type : undefined,
  }

  if (serializedEntity._meta_type === 'removed:placeholder') {
    const formatted: SerializedRemovedPlaceholder = formatEntityCommon(serializedEntity)
    return formatted
  } else {
    const formatted: SerializedInvEntity = formatEntityCommon(serializedEntity)
    return formatted
  }
}

function getRedirectedEntity (entity, params) {
  const { refresh, dry } = params
  // Passing the parameters as the entity data source might be Wikidata
  return getEntityByUri({ uri: entity.redirect, refresh, dry })
  .then(addRedirection.bind(null, prefixifyInv(entity._id)))
}

function aggregateFoundIds (foundIds, entity) {
  const { _id, redirects } = entity
  // Won't be true if the entity redirected to a Wikidata entity
  if (_id != null) foundIds.push(_id)
  if (redirects != null) foundIds.push(unprefixify(redirects.from))
  return foundIds
}
