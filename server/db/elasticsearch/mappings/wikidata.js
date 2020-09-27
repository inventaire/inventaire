const { text, integer, keyword, date, nested } = require('./mappings_datatypes')

module.exports = {
  properties: {
    type: keyword,
    id: {
      type: 'keyword',
      index: false
    },
    flattenedLabels: text,
    flattenedAliases: text,
    flattenedDescriptions: text,
    uri: keyword,
    images: nested,
    created: date,
    updated: date,
    popularity: integer,
  }
}
