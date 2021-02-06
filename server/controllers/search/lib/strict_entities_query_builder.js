const __ = require('config').universalPath
const { getSingularTypes } = __.require('lib', 'wikidata/aliases')
const { dropSpecialQueryCharacters, matchType } = require('./helpers')

module.exports = params => {
  const { search, limit: size, minScore = 1 } = params
  let { types } = params
  types = getSingularTypes(types)

  return {
    query: {
      function_score: {
        query: {
          bool: {
            must: [
              { bool: { should: matchType(types) } },
              { bool: { should: matchEntities(search) } }
            ]
          }
        },
      },
    },
    size,
    min_score: minScore
  }
}

const matchEntities = search => {
  return [
    {
      query_string: {
        query: dropSpecialQueryCharacters(search),
        default_operator: 'AND',
        fields: [
          'labels.*',
          'aliases.*^0.5',
          'flattenedLabels^0.25', // text type
          'flattenedAliases^0.25', // text type
        ]
      }
    }
  ]
}
