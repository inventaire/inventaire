import { difference } from 'lodash-es'
import { getInvEntitiesByIsbns } from '#controllers/entities/lib/entities'
import type { EntitiesGetterParams } from '#controllers/entities/lib/get_entities_by_uris'
import { getFirstClaimValue } from '#controllers/entities/lib/inv_claims_utils'
import { prefixifyIsbn } from '#controllers/entities/lib/prefix'
import { enrichAndGetEditionEntityFromIsbn } from '#data/dataseed/enrich_and_get_edition_entity_from_isbn'
import { getWdEntitiesByIsbns } from '#data/wikidata/get_wd_entities_by_isbns'
import { parseIsbn } from '#lib/isbn/parse'
import type { IsbnData } from '#server/types/common'
import type { EntityUri, InvEntity, Isbn, IsbnEntityUri, RedirectFromTo, SerializedEntity, ExpandedSerializedEntity } from '#types/entity'
import { formatEditionEntity } from './format_edition_entity.js'

export type Redirect = Record<EntityUri, EntityUri>

export interface EntitiesResults {
  // This should ideally be corrected to `SerializedEntity[] | ExpandedSerializedEntity[]` but that causes a type error
  entities: (SerializedEntity | ExpandedSerializedEntity)[]
  notFound?: IsbnEntityUri[]
}

export async function getEntitiesByIsbns (rawIsbns: Isbn[], params: EntitiesGetterParams = {}) {
  const { isbns13h: isbns, redirections, parsedIsbnsData } = getIsbnsData(rawIsbns)
  const { autocreate, refresh } = params
  const { entities: serializedWdEntities } = await getWdEntitiesByIsbns(parsedIsbnsData, params)
  const foundWdIsbns = serializedWdEntities.map(wdEntity => getFirstClaimValue(wdEntity.claims, 'wdt:P212'))
  const remainingIsbns = difference(isbns, foundWdIsbns)
  if (autocreate && refresh) {
    // Enrich editions that can be, but let getInvEntitiesByIsbns get the results
    // as enrichAndGetEditionEntityFromIsbn might return { isbn, notFound: true }
    // even if the local database has an existing entity with that ISBN.
    // Likely because getAuthoritiesAggregatedEntry didn't find anything
    await Promise.all(remainingIsbns.map(isbn => enrichAndGetEditionEntityFromIsbn(isbn)))
  }
  const invEntities = await getInvEntitiesByIsbns(remainingIsbns)
  const foundInvIsbns = invEntities.map(getIsbn13h)
  const missingIsbns = difference(isbns, foundInvIsbns)

  const { includeReferences } = params
  const serializedInvEntities = invEntities.map(entity => formatEditionEntity(entity, { includeReferences }))

  const serializedEntities = [ ...serializedWdEntities, ...serializedInvEntities ]

  const results = { entities: serializedEntities, notFound: [] as IsbnEntityUri[] }
  if (missingIsbns.length === 0) {
    setEntitiesRedirections(results, redirections)
    return results
  }

  // The cases where autocreate && refresh was already checked above
  if (autocreate && !refresh) {
    const resolvedEditions = await Promise.all(missingIsbns.map(isbn => enrichAndGetEditionEntityFromIsbn(isbn)))
    const newEntities = []
    const notFound = []
    for (const resolvedEdition of resolvedEditions) {
      if (resolvedEdition.notFound) notFound.push(prefixifyIsbn(resolvedEdition.isbn))
      else newEntities.push(resolvedEdition)
    }
    results.entities = [ ...serializedEntities, ...newEntities ]
    if (notFound.length > 0) results.notFound = notFound
  } else {
    results.notFound = missingIsbns.map(prefixifyIsbn)
  }

  setEntitiesRedirections(results, redirections)
  return results
}

function getIsbn13h (entity: InvEntity) {
  return getFirstClaimValue(entity.claims, 'wdt:P212')
}

type RedirectionsByUris = Record<EntityUri, RedirectFromTo>
export type ParsedIsbnData = IsbnData & { uri: IsbnEntityUri }

// Redirection mechanism is coupled with the way
// ./get_entities_by_uris 'mergeResponses' parses redirections
function getIsbnsData (isbns: string[]) {
  const isbns13h: string[] = []
  const redirections: RedirectionsByUris = {}
  const parsedIsbnsData: ParsedIsbnData[] = []
  for (const rawIsbn of isbns) {
    const parsedIsbnData = parseIsbn(rawIsbn)
    const { isbn13: uriIsbn, isbn13h: claimIsbn } = parsedIsbnData
    const rawUri = `isbn:${rawIsbn}`
    const uri: IsbnEntityUri = `isbn:${uriIsbn}`
    parsedIsbnsData.push({ ...parsedIsbnData, uri })
    isbns13h.push(claimIsbn)
    if (rawUri !== uri) {
      redirections[uri] = { from: rawUri, to: uri }
    }
  }
  return { isbns13h, redirections, parsedIsbnsData }
}

function setEntitiesRedirections (results: EntitiesResults, redirections: RedirectionsByUris) {
  for (const entity of results.entities) {
    const { uri } = entity
    const redirects = redirections[uri]
    if (redirects != null) entity.redirects = redirects
  }
}
