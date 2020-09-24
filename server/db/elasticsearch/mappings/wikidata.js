const { text, keyword, date, nested } = require('./mappings_datatypes')

module.exports = {
  properties: {
    type: keyword,
    id: { index: false },
    labels: nested,
    aliases: nested,
    descriptions: nested,
    flattenedLabels: text,
    flattenedAliases: text,
    flattenedDescriptions: text,
    uri: keyword,
    images: nested,
    created: date,
    updated: date,
  }
}
