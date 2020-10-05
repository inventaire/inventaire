const { activeI18nLangs } = require('../helpers')

// See https://www.elastic.co/guide/en/elasticsearch/reference/current/mapping-types.html

const langProperties = () => {
  const properties = {}
  activeI18nLangs.forEach(lang => {
    properties[lang] = {
      type: 'text',
      analyzer: 'autocomplete',
      // adding a 'search_analyzer' key to use a different analyzer at search time,
      // See: https://www.elastic.co/guide/en/elasticsearch/reference/current/search-analyzer.html
      search_analyzer: 'simple'
    }
  })
  return properties
}

module.exports = {
  text: { type: 'text' },
  integer: { type: 'integer' },
  nested: { type: 'nested' },
  keyword: { type: 'keyword' },
  date: { type: 'date' },
  flattened: { type: 'flattened' },
  langProperties: { properties: langProperties() }
}
