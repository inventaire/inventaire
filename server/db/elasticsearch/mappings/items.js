const { text, keyword, keywordArray, date } = require('./mappings_datatypes')

module.exports = {
  properties: {
    _rev: keyword,
    owner: keyword,
    entity: keyword,
    visibility: keywordArray,
    transaction: keyword,
    created: date,
    details: text,
    shelves: keywordArray,
    snapshot: {
      properties: {
        'entity:title': text,
        'entity:subtitle': text,
        'entity:authors': text,
        'entity:series': text,
        'entity:lang': keyword,
        // Stored to be accessible from search results.
        // Indexation can not be disabled here as it's not possible with type=keyword
        // See https://www.elastic.co/guide/en/elasticsearch/reference/current/enabled.html
        'entity:image': keyword,
      }
    }
  }
}
