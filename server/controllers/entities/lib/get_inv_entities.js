import _ from '#builders/utils'
import { getEntitiesByIds } from '#controllers/entities/lib/entities'
import { prefixifyInv, unprefixify } from '#controllers/entities/lib/prefix'
import addRedirection from './add_redirection.js'
import formatEntityCommon from './format_entity_common.js'
import getEntityType from './get_entity_type.js'
import getInvEntityCanonicalUri from './get_inv_entity_canonical_uri.js'

let getEntityByUri
const importCircularDependencies = async () => {
  getEntityByUri = await import('./get_entity_by_uri.js')
}
setImmediate(importCircularDependencies)

// Hypothesis: there is no need to look for Wikidata data here
// as inv entities with an associated Wikidata entity use the Wikidata uri
export default async (ids, params) => {
  let entities = await getEntitiesByIds(ids)
  entities = await Promise.all(entities.map(Format(params)))
  const found = entities.reduce(aggregateFoundIds, [])
  const notFound = _.difference(ids, found).map(prefixifyInv)
  return { entities, notFound }
}

const Format = params => async entity => {
  if (entity.redirect != null) return getRedirectedEntity(entity, params)

  const [ uri, redirects ] = getInvEntityCanonicalUri(entity, { includeRedirection: true })
  entity.uri = uri
  if (redirects != null) { entity.redirects = redirects }

  // Keep track of special types such as removed:placehoder
  // to the let the search engine unindex it
  if (entity.type !== 'entity') { entity._meta_type = entity.type }

  entity.type = getEntityType(entity.claims['wdt:P31'])
  return formatEntityCommon(entity)
}

const getRedirectedEntity = (entity, params) => {
  const { refresh, dry } = params
  // Passing the parameters as the entity data source might be Wikidata
  return getEntityByUri({ uri: entity.redirect, refresh, dry })
  .then(addRedirection.bind(null, prefixifyInv(entity._id)))
}

const aggregateFoundIds = (foundIds, entity) => {
  const { _id, redirects } = entity
  // Won't be true if the entity redirected to a Wikidata entity
  if (_id != null) foundIds.push(_id)
  if (redirects != null) foundIds.push(unprefixify(redirects.from))
  return foundIds
}
