const __ = require('config').universalPath
const { getSingularTypes } = __.require('lib', 'wikidata/aliases')

module.exports = params => {
  const { lang: userLang, search, limit: size, exact, minScore = 1 } = params
  let { types } = params
  types = getSingularTypes(types)

  return {
    query: {
      function_score: {
        query: {
          bool: {
            filter: [
              // at least one type should match
              // this is basically an 'or' operator
              { bool: { should: matchType(types) } },
            ],
            must: [
              // Because most of the work has been done at index time (indexing terms by ngrams)
              // all this query needs to do is to look up search terms which is way more efficient than the match_phrase_prefix approach
              // See https://www.elastic.co/guide/en/elasticsearch/guide/current/_index_time_search_as_you_type.html
              { bool: { should: matchEntities(search, userLang, exact) } }
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

const matchType = types => types.map(type => ({ term: { type } }))

const matchEntities = (search, userLang, exact) => {
  const fields = entitiesFields(userLang, exact)

  const should = [
    {
      // Use query_string to give exact matches a boost.
      // See query strings doc : https://www.elastic.co/guide/en/elasticsearch/reference/7.10/query-dsl-query-string-query.html
      multi_match: {
        query: search,
        operator: 'and',
        fields,
        analyzer: 'standard',
        type: 'best_fields',
        boost: 3
      }
    }
  ]

  if (!exact) {
    should.push({
      multi_match: {
        query: search,
        fields,
        analyzer: 'standard',
      }
    })
  }

  return should
}

const entitiesFields = (userLang, exact) => {
  const fields = [
    'labels.*',
    'aliases.*^0.5',
  ]
  if (userLang) {
    fields.push(
      `labels.${userLang}`,
      `aliases.${userLang}`
    )
  }
  if (!exact) {
    fields.push(
      'flattenedLabels^0.25',
      'flattenedAliases^0.25',
      'descriptions.*^0.25',
      'flattenedDescriptions^0.25'
    )
  }

  return fields
}
