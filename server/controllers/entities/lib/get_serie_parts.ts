import { flatten } from 'lodash-es'
import { getInvEntitiesByClaim, uniqByUri } from '#controllers/entities/lib/entities'
import { getFirstClaimValue } from '#controllers/entities/lib/inv_claims_utils'
import { prefixifyWd } from '#controllers/entities/lib/prefix'
import runWdQuery from '#data/wikidata/run_query'
import { LogErrorAndRethrow } from '#lib/utils/logs'
import type { EntityUri, InvEntity, SerializedEntity, WdEntityId } from '#server/types/entity'
import { getSimpleDayDate, sortByOrdinalOrDate } from './queries_utils.js'
import { getCachedRelations } from './temporarily_cache_relations.js'

export default params => {
  const { uri, refresh, dry, useCacheRelations = true } = params
  const [ prefix, id ] = uri.split(':')
  const promises = []

  // If the prefix is 'inv' or 'isbn', no need to check Wikidata
  if (prefix === 'wd') promises.push(getWdSerieParts(id, refresh, dry))

  promises.push(getInvSerieParts(uri))

  if (useCacheRelations) {
    promises.push(getCachedRelations({
      valueUri: uri,
      properties: [ 'wdt:P179' ],
      formatEntity: formatSerializedEntity,
    }))
  }

  return Promise.all(promises)
  .then(flatten)
  // There might be duplicates, mostly due to temporarily cached relations
  .then(uniqByUri)
  .then(results => ({
    parts: results.sort(sortByOrdinalOrDate),
  }))
  .catch(LogErrorAndRethrow('get serie parts err'))
}

async function getWdSerieParts (qid: WdEntityId, refresh: boolean, dry: boolean) {
  const results = await runWdQuery({ query: 'serie-parts', qid, refresh, dry })
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
    uri: `inv:${_id}`,
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
