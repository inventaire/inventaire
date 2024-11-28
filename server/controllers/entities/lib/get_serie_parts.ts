import { getInvEntitiesByClaim, uniqByUri } from '#controllers/entities/lib/entities'
import { getFirstClaimValue } from '#controllers/entities/lib/inv_claims_utils'
import { prefixifyWd } from '#controllers/entities/lib/prefix'
import { runWdQuery } from '#data/wikidata/run_query'
import type { EntityUri, InvEntity, InvEntityUri, SerializedEntity, WdEntityId } from '#types/entity'
import { getSimpleDayDate, sortByOrdinalOrDate } from './queries_utils.js'
import { getCachedRelations } from './temporarily_cache_relations.js'

interface GetSeriePartsParams {
  uri: EntityUri
  refresh?: boolean
  dry?: boolean
  useCacheRelations?: boolean
}

export interface SeriePart {
  uri: EntityUri
  date?: string
  ordinal?: string
  subparts?: number
  superpart?: EntityUri
}

export async function getSerieParts (params: GetSeriePartsParams) {
  const { uri, refresh, dry, useCacheRelations = true } = params
  const [ prefix, id ] = uri.split(':')
  const promises = [] as Promise<SeriePart[]>[]

  // If the prefix is 'inv' or 'isbn', no need to check Wikidata
  if (prefix === 'wd') promises.push(getWdSerieParts(id as WdEntityId, refresh, dry))

  promises.push(getInvSerieParts(uri))

  if (useCacheRelations) {
    promises.push(getCachedRelations({
      valueUri: uri,
      properties: [ 'wdt:P179' ],
      formatEntity: formatSerializedEntity,
    }))
  }

  const domainsParts = await Promise.all(promises)
  // There might be duplicates, mostly due to temporarily cached relations
  let parts = domainsParts.flat()
  parts = uniqByUri(parts)
  return {
    parts: parts.sort(sortByOrdinalOrDate),
  }
}

async function getWdSerieParts (qid: WdEntityId, refresh: boolean, dry: boolean) {
  const results = await runWdQuery({ query: 'serie_parts', qid, refresh, dry })
  return results.map(result => ({
    uri: prefixifyWd(result.part),
    date: getSimpleDayDate(result.date),
    ordinal: result.ordinal,
    subparts: result.subparts,
    superpart: result.superpart ? prefixifyWd(result.superpart) : undefined,
  }))
}

// Querying only for 'serie' (wdt:P179) and not 'part of' (wdt:P361)
// as we use only wdt:P179 internally
async function getInvSerieParts (uri: EntityUri) {
  const docs = await getInvEntitiesByClaim('wdt:P179', uri, true, true)
  return docs.map(formatInvEntity)
}

function formatInvEntity ({ _id, claims }: InvEntity) {
  return {
    uri: `inv:${_id}` as InvEntityUri,
    date: getFirstClaimValue(claims, 'wdt:P577'),
    ordinal: getFirstClaimValue(claims, 'wdt:P1545'),
    subparts: 0,
  }
}

function formatSerializedEntity (entity: SerializedEntity) {
  return {
    uri: entity.uri,
    date: getFirstClaimValue(entity.claims, 'wdt:P577'),
    ordinal: getFirstClaimValue(entity.claims, 'wdt:P1545'),
  }
}
