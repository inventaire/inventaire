// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS205: Consider reworking code to avoid use of IIFEs
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const __ = require('config').universalPath
const _ = __.require('builders', 'utils')
const error_ = __.require('lib', 'error/error')
const { Promise } = __.require('lib', 'promises')
const entities_ = require('./entities')
const items_ = __.require('controllers', 'items/lib/items')
const getEntitiesByUris = require('./get_entities_by_uris')

const criticalClaimProperties = [
  // No edition should end up without an associated work because of a removed work
  'wdt:P629'
]

module.exports = uris => Promise.all([
  entitiesRelationsChecks(uris),
  entitiesItemsChecks(uris)
])

var entitiesRelationsChecks = uris => Promise.all(uris.map(entityIsntUsedMuch))

var entityIsntUsedMuch = uri => entities_.byClaimsValue(uri)
.then((claims) => {
  // Tolerating 1 claim: typically when a junk author entity is linked via a wdt:P50 claim
  // to a work, the author can be deleted, which will also remove the claim on the work
  if (claims.length > 1) {
    throw error_.new('this entity has too many claims to be removed', 400, uri, claims)
  }

  return (() => {
    const result = []
    for (const claim of claims) {
      if (criticalClaimProperties.includes(claim.property)) {
        throw error_.new('this entity is used in a critical claim', 400, uri, claim)
      } else {
        result.push(undefined)
      }
    }
    return result
  })()
})

var entitiesItemsChecks = uris => getAllUris(uris)
.map(entityIsntUsedByAnyItem)

var getAllUris = uris => getEntitiesByUris({ uris })
.then((res) => {
  if (res.redirects == null) return uris
  const missingCanonicalUris = _.values(res.redirects)
  return uris.concat(missingCanonicalUris)
})

var entityIsntUsedByAnyItem = uri => items_.byEntity(uri)
.then((items) => {
  if (items.length > 0) {
    throw error_.new("entities that are used by an item can't be removed", 400, uri)
  }
})
