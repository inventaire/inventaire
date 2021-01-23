// Get and format Wikidata entities to match Inventaire entities:
// - simplify claims
// - add attributes: uri, originalLang
// - delete unnecessary attributes and ignore undesired claims
//   such as ISBNs defined on work entities

const __ = require('config').universalPath
const _ = __.require('builders', 'utils')
const wdk = require('wikidata-sdk')
const getOriginalLang = __.require('lib', 'wikidata/get_original_lang')
const formatClaims = __.require('lib', 'wikidata/format_claims')
const { simplify } = wdk
const getEntityType = require('./get_entity_type')
const { prefixifyWd, unprefixify } = __.require('controllers', 'entities/lib/prefix')
const cache_ = __.require('lib', 'cache')
const getWdEntity = __.require('data', 'wikidata/get_entity')
const addImageData = require('./add_image_data')
const radio = __.require('lib', 'radio')
const propagateRedirection = require('./propagate_redirection')
const { _id: hookUserId } = __.require('couch', 'hard_coded_documents').users.hook

// Working around the circular dependency
let reindex
const lateRequire = () => {
  reindex = __.require('elasticsearch', 'indexation')({ indexBaseName: 'wikidata' })
}
setTimeout(lateRequire, 0)

module.exports = (ids, params) => {
  return Promise.all(ids.map(getCachedEnrichedEntity(params)))
  .then(entities => {
    if (params.dry) { entities = _.compact(entities) }
    return { entities }
  })
}

const getCachedEnrichedEntity = params => wdId => {
  const key = `wd:enriched:${wdId}`
  const fn = getEnrichedEntity.bind(null, wdId)
  const { refresh, dry } = params
  return cache_.get({ key, fn, refresh, dry })
}

const getEnrichedEntity = async wdId => {
  const entity = await getWdEntity(wdId).then(format)
  const indexationCopy = _.cloneDeep(entity)
  indexationCopy._id = wdId
  reindex(indexationCopy)
  return entity
}

const format = entity => {
  if (entity.missing != null) return formatEmpty('missing', entity)

  const { P31, P279 } = entity.claims
  if (P31 || P279) {
    const simplifiedP31 = wdk.simplifyPropertyClaims(P31, simplifyClaimsOptions)
    const simplifiedP279 = wdk.simplifyPropertyClaims(P279, simplifyClaimsOptions)
    entity.type = getEntityType(simplifiedP31, simplifiedP279)
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

const formatValidEntity = entity => {
  const { id: wdId } = entity
  entity.uri = `wd:${wdId}`
  entity.labels = simplify.labels(entity.labels)
  entity.aliases = simplify.aliases(entity.aliases)
  entity.descriptions = simplify.descriptions(entity.descriptions)
  entity.sitelinks = simplify.sitelinks(entity.sitelinks)
  entity.claims = formatClaims(entity.claims, wdId)
  entity.originalLang = getOriginalLang(entity.claims)

  formatAndPropagateRedirection(entity)

  // Deleting unnecessary attributes
  delete entity.id
  delete entity.modified
  delete entity.pageid
  delete entity.ns
  delete entity.title
  delete entity.lastrevid

  return addImageData(entity)
}

const formatAndPropagateRedirection = entity => {
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
    radio.emit('wikidata:entity:redirect', entity.redirects.from, entity.redirects.to)
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
