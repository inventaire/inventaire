/* eslint-disable
    prefer-const,
*/
// TODO: This file was created by bulk-decaffeinate.
// Fix any style issues and re-enable lint.
/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const __ = require('config').universalPath
const _ = __.require('builders', 'utils')
const promises_ = __.require('lib', 'promises')
const error_ = __.require('lib', 'error/error')
const assert_ = __.require('utils', 'assert_types')
const entities_ = require('./entities')
const runWdQuery = __.require('data', 'wikidata/run_query')
const { prefixifyWd } = __.require('controllers', 'entities/lib/prefix')
const { getSimpleDayDate, sortByScore } = require('./queries_utils')
const { types, typesNames, getTypePluralNameByTypeUri } = __.require('lib', 'wikidata/aliases')

// Working around the circular dependency
let getEntitiesPopularity = null
const lateRequire = () => getEntitiesPopularity = require('./get_entities_popularity')
setTimeout(lateRequire, 0)

const whitelistedTypesNames = [ 'series', 'works', 'articles' ]

module.exports = function(params){
  const { uri } = params
  const [ prefix, id ] = Array.from(uri.split(':'))
  const promises = []

  const worksByTypes = _.initCollectionsIndex(whitelistedTypesNames)

  // If the prefix is 'inv' or 'isbn', no need to check Wikidata
  if (prefix === 'wd') {
    promises.push(getWdAuthorWorks(id, worksByTypes, params))
  }

  promises.push(getInvAuthorWorks(uri, worksByTypes))

  return promises_.all(promises)
  .then(_.flatten)
  .then(results => getPopularityScores(results)
  .then(spreadByType(worksByTypes, results))).catch(_.ErrorRethrow('get author works err'))
}

//# WD
var getWdAuthorWorks = function(qid, worksByTypes, params){
  const { refresh, dry } = params
  return runWdQuery({ query: 'author-works', qid, refresh, dry })
  .map(formatWdEntity)
  .filter(_.identity)
  .then((results) => {
    // Known case of duplicate: when an entity has two P31 values that both
    // resolve to the same whitelisted type
    // ex: Q23701761 → P31 → Q571/Q17518461
    // Deduplicate after formatting so that if an entity has one valid P31
    // and an invalid one, it still gets one
    const uris = []
    return results.filter(deduplicate(uris))
  })
}

var deduplicate = uris => (function(result) {
  const { uri } = result
  if (uris.includes(uri)) {
    _.warn(uri, `duplicated id: ${uri}`)
    return false
  } else {
    uris.push(uri)
    return true
  }
})

var formatWdEntity = function(result){
  let { work:wdId, type:typeWdId, date, serie } = result
  const typeUri = `wd:${typeWdId}`
  const typeName = getTypePluralNameByTypeUri(typeUri)

  if (!whitelistedTypesNames.includes(typeName)) { return }

  date = getSimpleDayDate(date)
  serie = prefixifyWd(serie)
  return { type: typeName, uri: `wd:${wdId}`, date, serie }
}

//# INV
var getInvAuthorWorks = (uri, worksByTypes) => entities_.byClaim('wdt:P50', uri, true)
.get('rows')
.map(formatInvEntity)
.filter(_.identity)

var formatInvEntity = function(row){
  const typeUri = row.value
  const typeName = getTypePluralNameByTypeUri(typeUri)
  if (!whitelistedTypesNames.includes(typeName)) { return }
  return {
    uri: `inv:${row.id}`,
    date: (row.doc.claims['wdt:P577'] != null ? row.doc.claims['wdt:P577'][0] : undefined),
    serie: (row.doc.claims['wdt:P179'] != null ? row.doc.claims['wdt:P179'][0] : undefined),
    type: typeName
  }
}

//# COMMONS
var getPopularityScores = function(results){
  const uris = _.map(results, 'uri')
  return getEntitiesPopularity(uris)
}

var spreadByType = (worksByTypes, rows) => (function(scores) {
  for (const row of rows) {
    const { type } = row
    delete row.type
    row.score = scores[row.uri]
    worksByTypes[type].push(row)
  }

  return sortTypesByScore(worksByTypes)
})

// TODO: prevent a work with several wdt:P577 values to appear several times
// ex: https://inventaire.io/api/entities?action=serie-parts&uri=wd:Q8337
var sortTypesByScore = function(worksByTypes){
  for (const name in worksByTypes) {
    const results = worksByTypes[name]
    worksByTypes[name] = results.sort(sortByScore)
  }
  return worksByTypes
}
