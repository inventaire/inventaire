const { text, integer, keyword, date, nested, terms } = require('./mappings_datatypes')

module.exports = {
  properties: {
    type: keyword,
    labels: terms,
    aliases: terms,
    descriptions: terms,
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
