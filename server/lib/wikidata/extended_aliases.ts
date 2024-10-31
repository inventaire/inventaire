import { uniq } from 'lodash-es'
import { prefixifyWd } from '#controllers/entities/lib/prefix'
import { makeSparqlRequest } from '#data/wikidata/make_sparql_request'
import { extendedAliasesQueries } from '#data/wikidata/queries/extended_type_aliases_queries'
import { cache_ } from '#lib/cache'
import { oneYear } from '#lib/time'
import { getHashCode, objectEntries } from '#lib/utils/base'
import { info, logError } from '#lib/utils/logs'
import { getTypesFromTypesAliases, typesAliases, type TypesAliases } from '#lib/wikidata/aliases'
import type { WdEntityId, WdEntityUri } from '#server/types/entity'

const { publishers: publishersP31Values } = typesAliases

const extendedTypesAliases = {} as TypesAliases

// Let scripts/refresh_entities_type_extended_aliases.sh force a refresh by setting an environment variable
const refresh = process.env.INV_REFRESH_ENTITIES_TYPE_EXTENDED_ALIASES === 'true'

async function getTypeExtendedAliases (type: string, sparql: string) {
  const hashCode = getHashCode(sparql)
  let extendedUris
  try {
    extendedUris = await cache_.get<WdEntityUri[]>({
    // Use a a hash code in the key to bust outdated results when the query changes
      key: `extended-wd-aliases:${type}:${hashCode}`,
      fn: async () => {
        info(`Fetching ${type} aliases...`)
        const ids = await makeSparqlRequest<WdEntityId>(sparql, { minimize: true })
        return ids.map(prefixifyWd)
      },
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
  return uniq(publishersP31Values.concat(extendedUris))
}

for (const [ type, sparql ] of objectEntries(extendedAliasesQueries)) {
  extendedTypesAliases[type] = await getTypeExtendedAliases(type, sparql)
}

export const typesByExtendedP31AliasesValues = getTypesFromTypesAliases(extendedTypesAliases)
