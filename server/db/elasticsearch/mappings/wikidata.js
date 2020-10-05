const { text, integer, keyword, date, nested } = require('./mappings_datatypes')

module.exports = {
  properties: {
    // "labels: nested" is already done by elasticsearch
    type: keyword,
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
