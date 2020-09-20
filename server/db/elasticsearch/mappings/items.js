const { string, keyword, date } = require('./mappings_datatypes')

module.exports = {
  item: {
    properties: {
      _rev: keyword,
      owner: keyword,
      entity: keyword,
      listing: keyword,
      transaction: keyword,
      created: date,
      snapshot: {
        properties: {
          'entity:title': string,
          'entity:subtitle': string,
          'entity:authors': string,
          'entity:series': string,
          'entity:lang': keyword
        }
      }
    }
  }
}
