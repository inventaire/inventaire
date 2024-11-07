import { identity, map, uniqBy } from 'lodash-es'
import { uniqByUri, getInvEntitiesByClaims, type ClaimPropertyValueTuple } from '#controllers/entities/lib/entities'
import { getFirstClaimValue } from '#controllers/entities/lib/inv_claims_utils'
import { getEntitiesPopularities, type PopularityScoreByUri } from '#controllers/entities/lib/popularity'
import { prefixifyWd } from '#controllers/entities/lib/prefix'
import { workAuthorRelationsProperties } from '#controllers/entities/lib/properties/properties'
import type { AuthorWork as WdAuthorWork } from '#data/wikidata/queries/author_works'
import { runWdQuery } from '#data/wikidata/run_query'
import { arrayIncludes, initCollectionsIndex } from '#lib/utils/base'
import { getPluralType, getPluralTypeByTypeUri } from '#lib/wikidata/aliases'
import type { ViewRow } from '#server/types/couchdb'
import type { EntityUri, EntityValue, InvEntity, InvEntityUri, SerializedEntity, WdEntityId, WdEntityUri } from '#server/types/entity'
import { getSimpleDayDate, sortByScore } from './queries_utils.js'
import { getCachedRelations } from './temporarily_cache_relations.js'
import type { OverrideProperties } from 'type-fest'

const allowlistedTypesNames = [ 'series', 'works', 'articles' ] as const
type TypeName = typeof allowlistedTypesNames[number]

interface GetAuthorWorksParams {
  uri: EntityUri
  refresh?: boolean
  dry?: boolean
}

export interface AuthorWork {
  uri: EntityUri
  date: string
  serie: EntityUri
  score: number
}
type TypedAuthorWork = OverrideProperties<AuthorWork, { score?: number }> & {
  type: string
}

export async function getAuthorWorks (params: GetAuthorWorksParams) {
  const { uri } = params
  const [ prefix, id ] = uri.split(':')
  const promises = [] as Promise<TypedAuthorWork[]>[]

  // If the prefix is 'inv' or 'isbn', no need to check Wikidata
  if (prefix === 'wd') {
    promises.push(getWdAuthorWorks(id as WdEntityId, params))
  }

  promises.push(getInvAuthorWorks(uri))

  promises.push(getCachedRelations({
    properties: workAuthorRelationsProperties,
    valueUri: uri,
    formatEntity,
  }))

  const domainsAuthorsWorks = await Promise.all(promises)
  let authorsWorks = domainsAuthorsWorks.flat()
  // There might be duplicates, mostly due to temporarily cached relations
  authorsWorks = uniqByUri(authorsWorks)
  const scoresByUri = await getPopularityScores(authorsWorks)
  return spreadByType(authorsWorks, scoresByUri)
}

// # WD
async function getWdAuthorWorks (qid: WdEntityId, params: GetAuthorWorksParams) {
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

function formatWdEntity (result: WdAuthorWork) {
  const { work: wdId, type: typeWdId, date, serie } = result
  const typeUri = `wd:${typeWdId}`
  const typeName = getPluralTypeByTypeUri(typeUri)

  if (!arrayIncludes(allowlistedTypesNames, typeName)) return

  return {
    type: typeName,
    uri: `wd:${wdId}` as WdEntityUri,
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
  if (!arrayIncludes(allowlistedTypesNames, typeName)) return
  return {
    uri: `inv:${row.id}` as InvEntityUri,
    date: getFirstClaimValue(row.doc.claims, 'wdt:P577'),
    serie: getFirstClaimValue(row.doc.claims, 'wdt:P179'),
    type: typeName,
  }
}

// # COMMONS
function getPopularityScores (results: TypedAuthorWork[]) {
  const uris = map(results, 'uri')
  return getEntitiesPopularities({ uris })
}

function spreadByType (rows: TypedAuthorWork[], scores: PopularityScoreByUri) {
  const worksByTypes = initCollectionsIndex<TypeName, AuthorWork>(allowlistedTypesNames)
  for (const row of rows) {
    const { type } = row
    delete row.type
    row.score = scores[row.uri]
    worksByTypes[type].push(row)
  }
  return sortTypesByScore(worksByTypes)
}

// TODO: prevent a work with several wdt:P577 values to appear several times
function sortTypesByScore (worksByTypes: Record<TypeName, AuthorWork[]>) {
  for (const name in worksByTypes) {
    const results = worksByTypes[name]
    worksByTypes[name] = results.sort(sortByScore)
  }
  return worksByTypes
}

function formatEntity (entity: SerializedEntity) {
  return {
    uri: entity.uri,
    date: getFirstClaimValue(entity.claims, 'wdt:P577'),
    serie: getFirstClaimValue(entity.claims, 'wdt:P179'),
    type: getPluralType(entity.type),
  }
}
