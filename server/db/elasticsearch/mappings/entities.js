const { flattenedTerms, integer, keyword, date, objectNotIndexed, terms } = require('./mappings_datatypes')

module.exports = {
  properties: {
    type: keyword,
    labels: terms,
    aliases: terms,
    descriptions: terms,
    flattenedLabels: flattenedTerms,
    flattenedAliases: flattenedTerms,
    flattenedDescriptions: flattenedTerms,
    relationsTerms: flattenedTerms,
    uri: keyword,
    images: objectNotIndexed,
    created: date,
    updated: date,
    popularity: integer,
    claim: keyword,
  }
}
