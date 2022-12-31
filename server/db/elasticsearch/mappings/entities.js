import {
  flattenedTerms,
  integer,
  keyword,
  date,
  objectNotIndexed,
  autocompleteTerms,
  fullTerms,
} from './mappings_datatypes'

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
  }
}
