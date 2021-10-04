const { activeI18nLangs } = require('../helpers')
const termsProperties = activeI18nLangs.concat([ 'fromclaims' ])

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

const getTermsProperties = groupedField => {
  const properties = {}
  // See https://www.elastic.co/guide/en/elasticsearch/reference/master/copy-to.html
  const mapping = Object.assign({ copy_to: groupedField }, autocompleteText)
  termsProperties.forEach(lang => { properties[lang] = mapping })
  return properties
}

module.exports = {
  boolean: { type: 'boolean' },
  date: { type: 'date' },
  flattened: { type: 'flattened' },
  flattenedTerms: autocompleteText,
  geoPoint: { type: 'geo_point' },
  groupedTerms: groupedField => ({ properties: getTermsProperties(groupedField) }),
  integer: { type: 'integer' },
  keyword: { type: 'keyword' },
  // See https://www.elastic.co/guide/en/elasticsearch/reference/current/enabled.html
  objectNotIndexed: { type: 'object', enabled: false },
  text: { type: 'text' },
}
