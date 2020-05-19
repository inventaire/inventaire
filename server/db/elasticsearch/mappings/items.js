const { string, keyword, date } = require('./mappings_datatypes')

module.exports = {
  item: {
    properties: {
      owner: keyword,
      _rev: keyword,
      created: date,
      entity: keyword,
      listing: keyword,
      snapshot: {
        properties: {
          'entity:title': string,
          'entity:subtitle': string,
          'entity:authors': string,
          'entity:series': string
        }
      }
    }
  }
}
