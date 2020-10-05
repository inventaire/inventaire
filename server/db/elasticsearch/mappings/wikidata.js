const { text, integer, keyword, date, nested, langProperties } = require('./mappings_datatypes')

module.exports = {
  properties: {
    type: keyword,
    labels: langProperties,
    aliases: langProperties,
    descriptions: langProperties,
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
