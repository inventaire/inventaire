const __ = require('config').universalPath
const { getSingularTypes } = __.require('lib', 'wikidata/aliases')

module.exports = params => {
  const { lang: userLang, search, limit: size, minScore = 1 } = params
  let { types } = params
  types = getSingularTypes(types)

  return {
    query: {
      function_score: {
        query: {
          bool: {
            must: [
              // at least one type should match
              // this is basically an 'or' operator
              { bool: { should: matchType(types) } },
              // Because most of the work has been done at index time (indexing terms by ngrams)
              // all this query needs to do is to look up search terms which is way more efficient than the match_phrase_prefix approach
              // See https://www.elastic.co/guide/en/elasticsearch/guide/current/_index_time_search_as_you_type.html
              { bool: { should: matchEntities(search, userLang) } }
            ]
          }
        },
        functions: [
          {
            // See: https://www.elastic.co/guide/en/elasticsearch/reference/7.10/query-dsl-function-score-query.html#function-field-value-factor
            field_value_factor: {
              field: 'popularity',
              modifier: 'sqrt',
              missing: 0
            },
          }
        ],
        // add the function result to the _score (instead of multiplying by default)
        // which is drastically decreasing popularity boosting compared to default
        boost_mode: 'sum'
      },
    },
    size,
    min_score: minScore
  }
}

const matchType = types => {
  return types.map(type => (
    { match: { type } }
  ))
}

const matchEntities = (search, userLang) => {
  const fields = entitiesFields(userLang)
  return [
    {
      // Use query_string to give exact matches a boost.
      // See query strings doc : https://www.elastic.co/guide/en/elasticsearch/reference/7.10/query-dsl-query-string-query.html
      query_string: {
        query: dropSpecialQueryCharacters(search),
        default_operator: 'AND',
        fields,
        boost: 3
      }
    },
    {
      multi_match: {
        query: search,
        fields,
      }
    }
  ]
}

const entitiesFields = userLang => {
  const fields = [
    'labels.*',
    'aliases.*^0.5',
    'descriptions.*^0.25',
    'flattenedLabels^0.25', // text type
    'flattenedAliases^0.25', // text type
    'flattenedDescriptions^0.25' // text type
  ]
  if (userLang) {
    fields.push(`labels.${userLang}`)
    fields.push(`aliases.${userLang}`)
  }
  return fields
}

const specialQueryCharacters = /[!*~+/\\]/g
const dropSpecialQueryCharacters = str => str.replace(specialQueryCharacters, '')
