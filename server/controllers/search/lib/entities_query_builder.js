const { getSingularTypes } = require('lib/wikidata/aliases')

module.exports = params => {
  const { lang: userLang, search, limit: size, exact, minScore = 1 } = params
  let { types } = params
  types = getSingularTypes(types)

  const boolMode = exact ? 'must' : 'should'

  return {
    query: {
      function_score: {
        query: {
          bool: {
            filter: [
              // At least one type should match
              // See https://www.elastic.co/guide/en/elasticsearch/reference/7.10/query-dsl-terms-query.html
              { terms: { type: types } }
            ],
            // Because most of the work has been done at index time (indexing terms by ngrams)
            // all this query needs to do is to look up search terms which is way more efficient than the match_phrase_prefix approach
            // See https://www.elastic.co/guide/en/elasticsearch/guide/current/_index_time_search_as_you_type.html
            [boolMode]: matchEntities(search, userLang, exact)
          }
        },
        // See: https://www.elastic.co/guide/en/elasticsearch/reference/7.10/query-dsl-function-score-query.html#function-field-value-factor
        field_value_factor: {
          field: 'popularity',
          // Inspired by https://www.elastic.co/guide/en/elasticsearch/guide/current/boosting-by-popularity.html
          modifier: 'ln2p',
          missing: 1
        },
      },
    },
    size,
    min_score: minScore
  }
}

const matchEntities = (search, userLang, exact) => {
  const fields = entitiesFields(userLang, exact)

  const queries = [
    {
      // Use query_string to give exact matches a boost.
      // See query strings doc : https://www.elastic.co/guide/en/elasticsearch/reference/7.10/query-dsl-query-string-query.html
      multi_match: {
        query: search,
        operator: 'and',
        fields,
        analyzer: 'standard_truncated',
        type: 'best_fields',
        boost: 3
      }
    }
  ]

  if (!exact) {
    queries.push({
      multi_match: {
        query: search,
        operator: 'or',
        fields,
        analyzer: 'standard_truncated',
        type: 'cross_fields',
      }
    })
  }

  return queries
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
