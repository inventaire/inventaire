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

const getTermsProperties = () => {
  const properties = {}
  activeI18nLangs.forEach(lang => {
    properties[lang] = autocompleteText
  })
  properties.fromclaims = autocompleteText
  return properties
}

module.exports = {
  boolean: { type: 'boolean' },
  date: { type: 'date' },
  flattened: { type: 'flattened' },
  geoPoint: { type: 'geo_point' },
  integer: { type: 'integer' },
  keyword: { type: 'keyword' },
  nested: { type: 'nested' },
  terms: { properties: getTermsProperties() },
  text: { type: 'text' },
  flattenedTerms: autocompleteText,
}
