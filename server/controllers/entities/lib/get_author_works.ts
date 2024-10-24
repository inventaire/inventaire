import { flatten, identity, map, uniqBy } from 'lodash-es'
import { uniqByUri, getInvEntitiesByClaims, type ClaimPropertyValueTuple } from '#controllers/entities/lib/entities'
import { getFirstClaimValue } from '#controllers/entities/lib/inv_claims_utils'
import { getEntitiesPopularities } from '#controllers/entities/lib/popularity'
import { prefixifyWd } from '#controllers/entities/lib/prefix'
import { workAuthorRelationsProperties } from '#controllers/entities/lib/properties/properties'
import type { AuthorWork } from '#data/wikidata/queries/author_works'
import { runWdQuery } from '#data/wikidata/run_query'
import { initCollectionsIndex } from '#lib/utils/base'
import { LogErrorAndRethrow } from '#lib/utils/logs'
import { getPluralType, getPluralTypeByTypeUri } from '#lib/wikidata/aliases'
import type { ViewRow } from '#server/types/couchdb'
import type { EntityUri, EntityValue, InvEntity } from '#server/types/entity'
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
    properties: workAuthorRelationsProperties,
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
  const results = await runWdQuery({ query: 'author_works', qid, refresh, dry })
  const formattedResults = results.map(formatWdEntity).filter(identity)
  // Known case of duplicate: when an entity has two P31 values that both
  // resolve to the same allowlisted type
  // ex: Q23701761 → P31 → Q571/Q17518461
  // Deduplicate after formatting so that if an entity has one valid P31
  // and an invalid one, it still gets one
  return uniqBy(formattedResults, 'uri')
}

function formatWdEntity (result: AuthorWork) {
  let { work: wdId, type: typeWdId, date, serie } = result
  const typeUri = `wd:${typeWdId}`
  const typeName = getPluralTypeByTypeUri(typeUri)

  if (!allowlistedTypesNames.includes(typeName)) return

  return {
    type: typeName,
    uri: `wd:${wdId}`,
    date: getSimpleDayDate(date),
    serie: serie ? prefixifyWd(serie) : undefined,
  }
}

// # INV
async function getInvAuthorWorks (uri: EntityUri) {
  const authorClaims = workAuthorRelationsProperties.map(property => [ property, uri ]) satisfies ClaimPropertyValueTuple[]
  const { rows } = await getInvEntitiesByClaims(authorClaims)
  return rows.map(formatInvEntity).filter(identity)
}

function formatInvEntity (row: ViewRow<EntityValue, InvEntity>) {
  const typeUri = row.value
  const typeName = getPluralTypeByTypeUri(typeUri)
  if (!allowlistedTypesNames.includes(typeName)) return
  return {
    uri: `inv:${row.id}`,
    date: getFirstClaimValue(row.doc.claims, 'wdt:P577'),
    serie: getFirstClaimValue(row.doc.claims, 'wdt:P179'),
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
    date: getFirstClaimValue(entity.claims, 'wdt:P577'),
    serie: getFirstClaimValue(entity.claims, 'wdt:P179'),
    type: getPluralType(entity.type),
  }
}
