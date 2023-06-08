import _ from '#builders/utils'
import { getEntitiesByClaim, firstClaim, uniqByUri } from '#controllers/entities/lib/entities'
import { prefixifyWd } from '#controllers/entities/lib/prefix'
import runWdQuery from '#data/wikidata/run_query'
import { LogErrorAndRethrow } from '#lib/utils/logs'
import { getPluralType, getPluralTypeByTypeUri } from '#lib/wikidata/aliases'
import { getSimpleDayDate, sortByScore } from './queries_utils.js'
import { getCachedRelations } from './temporarily_cache_relations.js'

let getEntitiesPopularities
const importCircularDependencies = async () => {
  ({ getEntitiesPopularities } = await import('./popularity.js'))
}
setImmediate(importCircularDependencies)

const allowlistedTypesNames = [ 'series', 'works', 'articles' ]

export function getAuthorWorks (params) {
  const { uri } = params
  const [ prefix, id ] = uri.split(':')
  const promises = []

  const worksByTypes = _.initCollectionsIndex(allowlistedTypesNames)

  // If the prefix is 'inv' or 'isbn', no need to check Wikidata
  if (prefix === 'wd') {
    promises.push(getWdAuthorWorks(id, params))
  }

  promises.push(getInvAuthorWorks(uri))

  promises.push(getCachedRelations(uri, 'wdt:P50', formatEntity))

  return Promise.all(promises)
  .then(_.flatten)
  // There might be duplicates, mostly due to temporarily cached relations
  .then(uniqByUri)
  .then(results => getPopularityScores(results)
  .then(spreadByType(worksByTypes, results)))
  .catch(LogErrorAndRethrow('get author works err'))
}

// # WD
const getWdAuthorWorks = async (qid, params) => {
  const { refresh, dry } = params
  let results = await runWdQuery({ query: 'author-works', qid, refresh, dry })
  results = results.map(formatWdEntity).filter(_.identity)
  // Known case of duplicate: when an entity has two P31 values that both
  // resolve to the same allowlisted type
  // ex: Q23701761 → P31 → Q571/Q17518461
  // Deduplicate after formatting so that if an entity has one valid P31
  // and an invalid one, it still gets one
  return _.uniqBy(results, 'uri')
}

const formatWdEntity = result => {
  let { work: wdId, type: typeWdId, date, serie } = result
  const typeUri = `wd:${typeWdId}`
  const typeName = getPluralTypeByTypeUri(typeUri)

  if (!allowlistedTypesNames.includes(typeName)) return

  date = getSimpleDayDate(date)
  serie = prefixifyWd(serie)
  return { type: typeName, uri: `wd:${wdId}`, date, serie }
}

// # INV
const getInvAuthorWorks = async uri => {
  const { rows } = await getEntitiesByClaim('wdt:P50', uri, true)
  return rows.map(formatInvEntity).filter(_.identity)
}

const formatInvEntity = row => {
  const typeUri = row.value
  const typeName = getPluralTypeByTypeUri(typeUri)
  if (!allowlistedTypesNames.includes(typeName)) return
  return {
    uri: `inv:${row.id}`,
    date: firstClaim(row.doc, 'wdt:P577'),
    serie: firstClaim(row.doc, 'wdt:P179'),
    type: typeName,
  }
}

// # COMMONS
const getPopularityScores = results => {
  const uris = _.map(results, 'uri')
  return getEntitiesPopularities({ uris })
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
const sortTypesByScore = worksByTypes => {
  for (const name in worksByTypes) {
    const results = worksByTypes[name]
    worksByTypes[name] = results.sort(sortByScore)
  }
  return worksByTypes
}

const formatEntity = entity => {
  return {
    uri: entity.uri,
    date: firstClaim(entity, 'wdt:P577'),
    serie: firstClaim(entity, 'wdt:P179'),
    type: getPluralType(entity.type),
  }
}
