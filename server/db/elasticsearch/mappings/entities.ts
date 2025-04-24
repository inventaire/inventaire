import {
  flattenedTerms,
  integer,
  keyword,
  date,
  objectNotIndexed,
  autocompleteTerms,
  fullTerms,
} from './mappings_datatypes.js'

export default {
  properties: {
    type: keyword,
    labels: autocompleteTerms,
    aliases: autocompleteTerms,
    fullLabels: fullTerms,
    fullAliases: fullTerms,
    descriptions: autocompleteTerms,
    flattenedLabels: flattenedTerms,
    flattenedAliases: flattenedTerms,
    flattenedDescriptions: flattenedTerms,
    relationsTerms: flattenedTerms,
    uri: keyword,
    images: objectNotIndexed,
    created: date,
    updated: date,
    popularity: integer,
    claim: keyword,
    // Indexing properties separately allows to make `terms` requests
    // which are cheaper than `prefix` requests, and don't require to set index_prefixes
    // See https://www.elastic.co/docs/reference/query-languages/query-dsl/query-dsl-prefix-query
    claimProperty: keyword,
  },
}
