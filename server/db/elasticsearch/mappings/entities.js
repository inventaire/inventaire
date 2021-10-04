const { flattenedTerms, integer, keyword, date, objectNotIndexed, groupedTerms } = require('./mappings_datatypes')

module.exports = {
  properties: {
    type: keyword,
    labels: groupedTerms('groupedLabels'),
    aliases: groupedTerms('groupedAliases'),
    descriptions: groupedTerms('groupedDescriptions'),
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
