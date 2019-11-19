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
const __ = require('config').universalPath
const _ = __.require('builders', 'utils')

const getSerieParts = require('./get_serie_parts')
const getAuthorWorks = require('./get_author_works')

// Working around circular dependencies
let items_, getEntityByUri, reverseClaims, getEntitiesPopularity
const lateRequire = () => {
  items_ = __.require('controllers', 'items/lib/items')
  getEntityByUri = require('./get_entity_by_uri')
  reverseClaims = require('./reverse_claims')
  getEntitiesPopularity = require('./get_entities_popularity')
}

setTimeout(lateRequire, 0)

module.exports = uri => getEntityByUri({ uri, dry: true })
.then(entity => {
  // Case where the entity wasn't available in cache
  if (entity == null) return 0

  const { type } = entity
  if (type == null) return 0

  const getter = popularityGettersByType[type]
  if (getter == null) return 0

  return getter(uri)
}).then(addBonusPoints(uri))

const getItemsCount = uri => items_.byEntity(uri)
.map(_.property('owner'))
// Count the owners so that no more than one item per user is counted
.then(owners => _.uniq(owners).length)

const getEditionsScores = property => uri => // Limit request to local entities as Wikidata editions entities are currently ignored
// see https://github.com/inventaire/inventaire/issues/182
  reverseClaims({ property, value: uri, dry: true })
.then(editonsUris => {
  const editonsCount = editonsUris.length
  return Promise.all(editonsUris.map(getItemsCount))
  .then(editionsItemsCounts => _.sum(editionsItemsCounts) + editonsCount)
})

const getWorkEditionsScores = getEditionsScores('wdt:P629')
const getPublisherScore = getEditionsScores('wdt:P123')

const getPartsScores = uri => getSerieParts({ uri, dry: true })
.then(res => {
  const partsUris = res.parts.map(getUri)
  return getEntitiesPopularityTotal(partsUris)
})

const getAuthorWorksScores = uri => getAuthorWorks({ uri, dry: true })
.then(res => {
  const worksUris = res.works.map(getUri)
  const seriesCount = res.series.length
  const articlesCount = res.articles.length
  return getEntitiesPopularityTotal(worksUris)
  .then(worksScore => worksScore + seriesCount + articlesCount)
})

const getUri = _.property('uri')

const getEntitiesPopularityTotal = uris => getEntitiesPopularity(uris, true)
.then(_.values)
// Total = sum of all popularities + number of subentities
.then(results => _.sum(results) + results.length)

const popularityGettersByType = {
  edition: getItemsCount,
  work: getWorkEditionsScores,
  serie: getPartsScores,
  human: getAuthorWorksScores,
  publisher: getPublisherScore
}

// Wikidata entities get a bonus as being on Wikidata is already kind of a proof of a certain
// level of popularity
const addBonusPoints = uri => score => {
  if (_.isWdEntityUri(uri)) {
    return score + 5
  } else {
    return score
  }
}
