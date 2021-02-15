const { activeI18nLangs } = require('../helpers')

// See https://www.elastic.co/guide/en/elasticsearch/reference/7.10/mapping-types.html

const langProperty = {
  type: 'text',
  analyzer: 'autocomplete',
  // Set a different default analyzer for search time,
  // See: https://www.elastic.co/guide/en/elasticsearch/reference/7.10/search-analyzer.html
  search_analyzer: 'standard'
  // To be considered for next reindexation: set norms.enabled=false as in our use case,
  // the kind of term (label, alias, or description) is more important than it's length
  // See https://www.elastic.co/guide/en/elasticsearch/guide/current/scoring-theory.html
}

const getTermsProperties = () => {
  const properties = {}
  activeI18nLangs.forEach(lang => {
    properties[lang] = langProperty
  })
  properties.fromclaims = langProperty
  return properties
}

module.exports = {
  text: { type: 'text' },
  integer: { type: 'integer' },
  nested: { type: 'nested' },
  keyword: { type: 'keyword' },
  date: { type: 'date' },
  flattened: { type: 'flattened' },
  terms: { properties: getTermsProperties() }
}
