import { intersection, uniq } from 'lodash-es'
import { prefixifyWd } from '#controllers/entities/lib/prefix'
import { makeSparqlRequest } from '#data/wikidata/make_sparql_request'
import { extendedAliasesQueries } from '#data/wikidata/queries/extended_type_aliases_queries'
import { cache_ } from '#lib/cache'
import { newError } from '#lib/error/error'
import { oneYear } from '#lib/time'
import { getHashCode, objectEntries } from '#lib/utils/base'
import { info, logError } from '#lib/utils/logs'
import { getTypesFromTypesAliases, typesAliases, type PluralizedEntityType, type TypesAliases } from '#lib/wikidata/aliases'
import type { WdEntityId, WdEntityUri } from '#server/types/entity'

const extendedTypesAliases = {} as TypesAliases

// Let scripts/refresh_entities_type_extended_aliases.sh force a refresh by setting an environment variable
const refresh = process.env.INV_REFRESH_ENTITIES_TYPE_EXTENDED_ALIASES === 'true'

for (const [ type, sparql ] of objectEntries(extendedAliasesQueries)) {
  const typeExtendedAliases = await getTypeExtendedAliases(type, sparql)
  checkOverlaps(type, typeExtendedAliases)
  extendedTypesAliases[type] = typeExtendedAliases
}

async function getTypeExtendedAliases (type: PluralizedEntityType, sparqlRequests: string | string[]) {
  const sparqlRequestsArray = sparqlRequests instanceof Array ? sparqlRequests : [ sparqlRequests ]
  const hashCode = getHashCode(sparqlRequestsArray.join())
  let extendedUris
  try {
    extendedUris = await cache_.get<WdEntityUri[]>({
    // Use a a hash code in the key to bust outdated results when the query changes
      key: `extended-wd-aliases:${type}:${hashCode}`,
      fn: () => makeQueries(type, sparqlRequestsArray),
      // Updates should rather be triggered by a script than by the server
      // to minimize server start time
      ttl: oneYear,
      refresh,
    })
  } catch (err) {
    logError(err, `failed to fetch ${type} extended aliases`)
    // Better start without extended uris than to prevent the server to start
    extendedUris = []
  }
  const P31Values = typesAliases[type]
  return uniq(P31Values.concat(extendedUris))
}

async function makeQueries (type: PluralizedEntityType, sparqlRequests: string[]) {
  info(`Fetching ${type} aliases...`)
  const ids = []
  for (const sparql of sparqlRequests) {
    try {
      const batchIds = await makeSparqlRequest<WdEntityId>(sparql, { minimize: true, noHostBanOnTimeout: true, timeout: 60000 })
      ids.push(...batchIds)
    } catch (err) {
      // Ignoring crashing subqueries to be more resilient to changes
      // on Wikidata that might make some of those queries fail
      logError(err, `failed query: ${sparql}`)
    }
  }
  return ids.map(prefixifyWd)
}

function checkOverlaps (type: PluralizedEntityType, typeExtendedAliases: WdEntityUri[]) {
  for (const [ otherType, otherTypeExtendedAliases ] of objectEntries(extendedTypesAliases)) {
    const overlap = intersection(typeExtendedAliases, otherTypeExtendedAliases)
    if (overlap.length > 0) {
      throw newError('type aliases overlap', 500, { type, otherType, overlap })
    }
  }
}

export const typesByExtendedP31AliasesValues = getTypesFromTypesAliases(extendedTypesAliases)
