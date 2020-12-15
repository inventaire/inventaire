const { text, keyword, date } = require('./mappings_datatypes')

module.exports = {
  properties: {
    _rev: keyword,
    owner: keyword,
    entity: keyword,
    listing: keyword,
    transaction: keyword,
    created: date,
    snapshot: {
      properties: {
        'entity:title': text,
        'entity:subtitle': text,
        'entity:authors': text,
        'entity:series': text,
        'entity:lang': keyword
      }
    }
  }
}
