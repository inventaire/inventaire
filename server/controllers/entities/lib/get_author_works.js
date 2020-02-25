const __ = require('config').universalPath
const _ = __.require('builders', 'utils')
const entities_ = require('./entities')
const runWdQuery = __.require('data', 'wikidata/run_query')
const { prefixifyWd } = __.require('controllers', 'entities/lib/prefix')
const { getSimpleDayDate, sortByScore } = require('./queries_utils')
const { getTypePluralNameByTypeUri } = __.require('lib', 'wikidata/aliases')

// Working around the circular dependency
let getEntitiesPopularity
const lateRequire = () => { getEntitiesPopularity = require('./get_entities_popularity') }
setTimeout(lateRequire, 0)

const whitelistedTypesNames = [ 'series', 'works', 'articles' ]

module.exports = params => {
  const { uri } = params
  const [ prefix, id ] = uri.split(':')
  const promises = []

  const worksByTypes = _.initCollectionsIndex(whitelistedTypesNames)

  // If the prefix is 'inv' or 'isbn', no need to check Wikidata
  if (prefix === 'wd') {
    promises.push(getWdAuthorWorks(id, worksByTypes, params))
  }

  promises.push(getInvAuthorWorks(uri, worksByTypes))

  return Promise.all(promises)
  .then(_.flatten)
  .then(results => getPopularityScores(results)
  .then(spreadByType(worksByTypes, results)))
  .catch(_.ErrorRethrow('get author works err'))
}

// # WD
const getWdAuthorWorks = async (qid, worksByTypes, params) => {
  const { refresh, dry } = params
  let results = await runWdQuery({ query: 'author-works', qid, refresh, dry })
  results = results.map(formatWdEntity).filter(_.identity)
  // Known case of duplicate: when an entity has two P31 values that both
  // resolve to the same whitelisted type
  // ex: Q23701761 → P31 → Q571/Q17518461
  // Deduplicate after formatting so that if an entity has one valid P31
  // and an invalid one, it still gets one
  return _.uniqBy(results, 'uri')
}

const formatWdEntity = result => {
  let { work: wdId, type: typeWdId, date, serie } = result
  const typeUri = `wd:${typeWdId}`
  const typeName = getTypePluralNameByTypeUri(typeUri)

  if (!whitelistedTypesNames.includes(typeName)) return

  date = getSimpleDayDate(date)
  serie = prefixifyWd(serie)
  return { type: typeName, uri: `wd:${wdId}`, date, serie }
}

// # INV
const getInvAuthorWorks = async (uri, worksByTypes) => {
  const { rows } = await entities_.byClaim('wdt:P50', uri, true)
  return rows.map(formatInvEntity).filter(_.identity)
}

const formatInvEntity = row => {
  const typeUri = row.value
  const typeName = getTypePluralNameByTypeUri(typeUri)
  if (!whitelistedTypesNames.includes(typeName)) return
  return {
    uri: `inv:${row.id}`,
    date: (row.doc.claims['wdt:P577'] != null ? row.doc.claims['wdt:P577'][0] : undefined),
    serie: (row.doc.claims['wdt:P179'] != null ? row.doc.claims['wdt:P179'][0] : undefined),
    type: typeName
  }
}

// # COMMONS
const getPopularityScores = results => {
  const uris = _.map(results, 'uri')
  return getEntitiesPopularity(uris)
}

const spreadByType = (worksByTypes, rows) => scores => {
  for (const row of rows) {
    const { type } = row
    delete row.type
    row.score = scores[row.uri]
    worksByTypes[type].push(row)
  }

  return sortTypesByScore(worksByTypes)
}

// TODO: prevent a work with several wdt:P577 values to appear several times
// ex: https://inventaire.io/api/entities?action=serie-parts&uri=wd:Q8337
const sortTypesByScore = worksByTypes => {
  for (const name in worksByTypes) {
    const results = worksByTypes[name]
    worksByTypes[name] = results.sort(sortByScore)
  }
  return worksByTypes
}
