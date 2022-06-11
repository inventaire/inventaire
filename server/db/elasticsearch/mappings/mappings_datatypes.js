const { activeI18nLangs } = require('../helpers')

// See https://www.elastic.co/guide/en/elasticsearch/reference/7.10/mapping-types.html

const autocompleteText = {
  type: 'text',
  analyzer: 'autocomplete',
  // Set a different default analyzer for search time,
  // as recommanded in https://www.elastic.co/guide/en/elasticsearch/reference/7.10/analysis-edgengram-tokenizer.html#max-gram-limits
  // See: https://www.elastic.co/guide/en/elasticsearch/reference/7.10/search-analyzer.html
  search_analyzer: 'standard_truncated'
  // To be considered for next reindexation: set norms.enabled=false as in our use case,
  // the kind of term (label, alias, or description) is more important than it's length
  // See https://www.elastic.co/guide/en/elasticsearch/guide/current/scoring-theory.html
}

const fullText = {
  type: 'text',
  // This analyzer won't produce ngram tokens, and can thus be used for exact match.
  // Ex: Searching for "fruit" won't produce a hit on document with "fruitful"
  analyzer: 'standard_full',
}

const getTermsProperties = datatype => {
  const properties = {}
  activeI18nLangs.forEach(lang => {
    properties[lang] = datatype
  })
  properties.fromclaims = datatype
  return properties
}

module.exports = {
  boolean: { type: 'boolean' },
  date: { type: 'date' },
  flattened: { type: 'flattened' },
  geoPoint: { type: 'geo_point' },
  integer: { type: 'integer' },
  keyword: { type: 'keyword' },
  // See https://www.elastic.co/guide/en/elasticsearch/reference/current/enabled.html
  objectNotIndexed: { type: 'object', enabled: false },
  autocompleteTerms: { properties: getTermsProperties(autocompleteText) },
  fullTerms: { properties: getTermsProperties(fullText) },
  text: { type: 'text' },
  flattenedTerms: autocompleteText,
  // Array types are equivalent to there values type,
  // see https://www.elastic.co/guide/en/elasticsearch/reference/current/array.html
  // so those are just aliases for documentation purpose
  keywordArray: { type: 'keyword' },
}
