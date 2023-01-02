import authorWorks from './author_works.js'
import serieParts from './serie_parts.js'
import publisherCollections from './publisher_collections.js'
import editionsReverseClaims from './editions_reverse_claims.js'
import worksReverseClaims from './works_reverse_claims.js'
import humansReverseClaims from './humans_reverse_claims.js'
import resolveExternalIds from './resolve_external_ids.js'

const queries = {
  author_works: authorWorks,
  serie_parts: serieParts,
  publisher_collections: publisherCollections,
  editions_reverse_claims: editionsReverseClaims,
  works_reverse_claims: worksReverseClaims,
  humans_reverse_claims: humansReverseClaims,
  resolve_external_ids: resolveExternalIds,
}

const queriesPerProperty = {}

for (const queryName in queries) {
  const { relationProperties } = queries[queryName]
  if (relationProperties) {
    relationProperties.forEach(property => {
      queriesPerProperty[property] = queriesPerProperty[property] || []
      queriesPerProperty[property].push(queryName)
    })
  }
}

export default { queries, queriesPerProperty }
