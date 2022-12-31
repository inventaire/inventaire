// Get and format Wikidata entities to match Inventaire entities:
// - simplify claims
// - add attributes: uri, originalLang
// - delete unnecessary attributes and ignore undesired claims
//   such as ISBNs defined on work entities

import _ from 'builders/utils'

import { simplify } from 'wikidata-sdk'
import getOriginalLang from 'lib/wikidata/get_original_lang'
import formatClaims from 'lib/wikidata/format_claims'
import getEntityType from './get_entity_type'
import { prefixifyWd, unprefixify } from 'controllers/entities/lib/prefix'
import cache_ from 'lib/cache'
import getWdEntity from 'data/wikidata/get_entity'
import addImageData from './add_image_data'
import radio from 'lib/radio'
import propagateRedirection from './propagate_redirection'
import { partition, map } from 'lodash'
const { propertyClaims: simplifyPropertyClaims } = simplify
const { _id: hookUserId } = require('db/couchdb/hard_coded_documents').users.hook

let reindex
const requireCircularDependencies = () => {
  reindex = require('db/elasticsearch/indexation')('wikidata')
}
setImmediate(requireCircularDependencies)

export default async (ids, params) => {
  const entities = await Promise.all(ids.map(getCachedEnrichedEntity(params)))
  let [ foundEntities, notFoundEntities ] = partition(entities, isNotMissing)
  if (params.dry) foundEntities = _.compact(foundEntities)
  return {
    entities: foundEntities,
    notFound: map(notFoundEntities, 'uri')
  }
}

const isNotMissing = entity => entity && entity.type !== 'missing'

const getCachedEnrichedEntity = params => wdId => {
  const key = `wd:enriched:${wdId}`
  const fn = getEnrichedEntity.bind(null, wdId)
  const { refresh, dry } = params
  return cache_.get({ key, fn, refresh, dry })
}

const getEnrichedEntity = async wdId => {
  let entity = await getWdEntity(wdId)
  entity = entity || { id: wdId, missing: true }
  const formattedEntity = await format(entity)
  const indexationCopy = _.cloneDeep(formattedEntity)
  indexationCopy._id = wdId
  reindex(indexationCopy)
  return formattedEntity
}

const format = async entity => {
  if (entity.missing != null) return formatEmpty('missing', entity)

  const { P31 } = entity.claims
  if (P31) {
    const simplifiedP31 = simplifyPropertyClaims(P31, simplifyClaimsOptions)
    entity.type = getEntityType(simplifiedP31)
  } else {
    // Make sure to override the type as Wikidata entities have a type with
    // another role in Wikibase, and we need this absence of known type to
    // filter-out entities that aren't in our focus (i.e. not works, author, etc)
    entity.type = null
  }

  entity.claims = omitUndesiredPropertiesPerType(entity.type, entity.claims)

  if (entity.type === 'meta') {
    return formatEmpty('meta', entity)
  } else {
    return formatValidEntity(entity)
  }
}

const simplifyClaimsOptions = { entityPrefix: 'wd' }

const formatValidEntity = async entity => {
  const { id: wdId } = entity
  entity.uri = `wd:${wdId}`
  entity.labels = simplify.labels(entity.labels)
  entity.aliases = simplify.aliases(entity.aliases)
  entity.descriptions = simplify.descriptions(entity.descriptions)
  entity.sitelinks = simplify.sitelinks(entity.sitelinks)
  entity.claims = formatClaims(entity.claims)
  entity.originalLang = getOriginalLang(entity.claims)

  await formatAndPropagateRedirection(entity)

  // Deleting unnecessary attributes
  delete entity.id
  delete entity.modified
  delete entity.pageid
  delete entity.ns
  delete entity.title
  delete entity.lastrevid

  return addImageData(entity)
}

const formatAndPropagateRedirection = async entity => {
  if (entity.redirects != null) {
    const { from, to } = entity.redirects
    entity.redirects = {
      from: prefixifyWd(from),
      to: prefixifyWd(to)
    }

    // Take advantage of this request for a Wikidata entity to check
    // if there is a redirection we are not aware of, and propagate it:
    // if the redirected entity is used in Inventaire claims, redirect claims
    // to their new entity
    propagateRedirection(hookUserId, entity.redirects.from, entity.redirects.to)
    reindex({ _id: unprefixify(entity.redirects.from), redirect: true })
    await radio.emit('wikidata:entity:redirect', entity.redirects.from, entity.redirects.to)
  }
}

// Keeping just enough data to filter-out while not cluttering the cache
const formatEmpty = (type, entity) => ({
  id: entity.id,
  uri: `wd:${entity.id}`,
  type
})

const omitUndesiredPropertiesPerType = (type, claims) => {
  const propertiesToOmit = undesiredPropertiesPerType[type]
  if (propertiesToOmit) {
    return _.omit(claims, propertiesToOmit)
  } else {
    return claims
  }
}

// Ignoring ISBN data set on work entities, as those
// should be the responsability of edition entities
const undesiredPropertiesPerType = {
  work: [ 'P212', 'P957' ]
}
