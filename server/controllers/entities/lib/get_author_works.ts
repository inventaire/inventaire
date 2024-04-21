import { flatten, identity, map, uniqBy } from 'lodash-es'
import { getFirstPropertyClaim, uniqByUri, getInvEntitiesByClaims } from '#controllers/entities/lib/entities'
import { getEntitiesPopularities } from '#controllers/entities/lib/popularity'
import { prefixifyWd } from '#controllers/entities/lib/prefix'
import { authorRelationsProperties } from '#controllers/entities/lib/properties/properties'
import runWdQuery from '#data/wikidata/run_query'
import { initCollectionsIndex } from '#lib/utils/base'
import { LogErrorAndRethrow } from '#lib/utils/logs'
import { getPluralType, getPluralTypeByTypeUri } from '#lib/wikidata/aliases'
import { getSimpleDayDate, sortByScore } from './queries_utils.js'
import { getCachedRelations } from './temporarily_cache_relations.js'

const allowlistedTypesNames = [ 'series', 'works', 'articles' ]

export function getAuthorWorks (params) {
  const { uri } = params
  const [ prefix, id ] = uri.split(':')
  const promises = []

  const worksByTypes = initCollectionsIndex(allowlistedTypesNames)

  // If the prefix is 'inv' or 'isbn', no need to check Wikidata
  if (prefix === 'wd') {
    promises.push(getWdAuthorWorks(id, params))
  }

  promises.push(getInvAuthorWorks(uri))

  promises.push(getCachedRelations({
    properties: authorRelationsProperties,
    valueUri: uri,
    formatEntity,
  }))

  return Promise.all(promises)
  .then(flatten)
  // There might be duplicates, mostly due to temporarily cached relations
  .then(uniqByUri)
  .then(results => getPopularityScores(results)
  .then(spreadByType(worksByTypes, results)))
  .catch(LogErrorAndRethrow('get author works err'))
}

// # WD
async function getWdAuthorWorks (qid, params) {
  const { refresh, dry } = params
  let results = await runWdQuery({ query: 'author-works', qid, refresh, dry })
  results = results.map(formatWdEntity).filter(identity)
  // Known case of duplicate: when an entity has two P31 values that both
  // resolve to the same allowlisted type
  // ex: Q23701761 → P31 → Q571/Q17518461
  // Deduplicate after formatting so that if an entity has one valid P31
  // and an invalid one, it still gets one
  return uniqBy(results, 'uri')
}

function formatWdEntity (result) {
  let { work: wdId, type: typeWdId, date, serie } = result
  const typeUri = `wd:${typeWdId}`
  const typeName = getPluralTypeByTypeUri(typeUri)

  if (!allowlistedTypesNames.includes(typeName)) return

  date = getSimpleDayDate(date)
  serie = prefixifyWd(serie)
  return { type: typeName, uri: `wd:${wdId}`, date, serie }
}

// # INV
async function getInvAuthorWorks (uri) {
  const authorClaims = authorRelationsProperties.map(property => [ property, uri ])
  const { rows } = await getInvEntitiesByClaims({ claims: authorClaims, includeDocs: true })
  return rows.map(formatInvEntity).filter(identity)
}

function formatInvEntity (row) {
  const typeUri = row.value
  const typeName = getPluralTypeByTypeUri(typeUri)
  if (!allowlistedTypesNames.includes(typeName)) return
  return {
    uri: `inv:${row.id}`,
    date: getFirstPropertyClaim(row.doc, 'wdt:P577'),
    serie: getFirstPropertyClaim(row.doc, 'wdt:P179'),
    type: typeName,
  }
}

// # COMMONS
function getPopularityScores (results) {
  const uris = map(results, 'uri')
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
function sortTypesByScore (worksByTypes) {
  for (const name in worksByTypes) {
    const results = worksByTypes[name]
    worksByTypes[name] = results.sort(sortByScore)
  }
  return worksByTypes
}

function formatEntity (entity) {
  return {
    uri: entity.uri,
    date: getFirstPropertyClaim(entity, 'wdt:P577'),
    serie: getFirstPropertyClaim(entity, 'wdt:P179'),
    type: getPluralType(entity.type),
  }
}
