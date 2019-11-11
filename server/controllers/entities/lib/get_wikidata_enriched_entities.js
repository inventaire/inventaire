/* eslint-disable
    implicit-arrow-linebreak,
*/
// TODO: This file was created by bulk-decaffeinate.
// Fix any style issues and re-enable lint.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
// Get and format Wikidata entities to match Inventaire entities:
// - simplify claims
// - add attributes: uri, originalLang
// - delete unnecessary attributes and ignore undesired claims
//   such as ISBNs defined on work entities

const __ = require('config').universalPath
const _ = __.require('builders', 'utils')
const { Promise } = __.require('lib', 'promises')
const wdk = require('wikidata-sdk')
const getOriginalLang = __.require('lib', 'wikidata/get_original_lang')
const formatClaims = __.require('lib', 'wikidata/format_claims')
const { simplify } = wdk
const getEntityType = require('./get_entity_type')
const { prefixifyWd } = __.require('controllers', 'entities/lib/prefix')
const entities_ = require('./entities')
const cache_ = __.require('lib', 'cache')
const promises_ = __.require('lib', 'promises')
const getWdEntity = __.require('data', 'wikidata/get_entity')
const addImageData = require('./add_image_data')
const radio = __.require('lib', 'radio')
const propagateRedirection = require('./propagate_redirection')
const { _id:hookUserId } = __.require('couch', 'hard_coded_documents').users.hook

module.exports = (ids, params) => promises_.all(ids.map(getCachedEnrichedEntity(params)))
.then((entities) => {
  if (params.dry) { entities = _.compact(entities) }
  return { entities }})

var getCachedEnrichedEntity = params => (function(wdId) {
  const key = `wd:enriched:${wdId}`
  const fn = getEnrichedEntity.bind(null, wdId)
  const { refresh, dry } = params
  return cache_.get({ key, fn, refresh, dry })
})

var getEnrichedEntity = wdId => getWdEntity(wdId)
.then(format)

var format = function(entity){
  if (entity.missing != null) {
    // Make sure the entity is unindexed
    radio.emit('wikidata:entity:cache:miss', entity.id)
    return formatEmpty('missing', entity)
  }

  const { P31, P279 } = entity.claims
  if ((P31 != null) || (P279 != null)) {
    const simplifiedP31 = wdk.simplifyPropertyClaims(P31, simplifyClaimsOptions)
    const simplifiedP279 = wdk.simplifyPropertyClaims(P279, simplifyClaimsOptions)
    entity.type = getEntityType(simplifiedP31, simplifiedP279)
  } else {
    // Make sure to override the type as Wikidata entities have a type with
    // another role in Wikibase, and we need this absence of known type to
    // filter-out entities that aren't in our focus (i.e. not works, author, etc)
    entity.type = null
  }

  radio.emit('wikidata:entity:cache:miss', entity.id, entity.type)

  entity.claims = omitUndesiredPropertiesPerType(entity.type, entity.claims)

  if (entity.type === 'meta') { return formatEmpty('meta', entity)
  } else { return formatValidEntity(entity) }
}

var simplifyClaimsOptions = { entityPrefix: 'wd' }

var formatValidEntity = function(entity){
  const { id:wdId } = entity
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

var formatAndPropagateRedirection = function(entity){
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
    radio.emit('wikidata:entity:redirect', entity.redirects.from, entity.redirects.to)
  }

}

var formatEmpty = (type, entity) => // Keeping just enough data to filter-out while not cluttering the cache
  ({
    id: entity.id,
    uri: `wd:${entity.id}`,
    type
  })

var omitUndesiredPropertiesPerType = function(type, claims){
  const propertiesToOmit = undesiredPropertiesPerType[type]
  if (propertiesToOmit != null) { return _.omit(claims, propertiesToOmit)
  } else { return claims }
}

var undesiredPropertiesPerType =
  // Ignoring ISBN data set on work entities, as those
  // should be the responsability of edition entities
  { work: [ 'P212', 'P957' ] }
