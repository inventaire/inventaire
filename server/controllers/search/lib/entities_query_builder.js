module.exports = params => {
  const { lang: userLang, search, limit: size } = params
  let { types } = params
  types = singularTypes(types)

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
            // See: https://www.elastic.co/guide/en/elasticsearch/reference/current/query-dsl-function-score-query.html#function-field-value-factor
            field_value_factor: {
              field: 'popularity',
              // Inspired by https://www.elastic.co/guide/en/elasticsearch/guide/current/boosting-by-popularity.html
              modifier: 'ln1p'
            },
          }
        ]
      },
    },
    size,
    min_score: 1
  }
}

const singularTypes = types => types.map(type => type.replace(/s$/, ''))

const matchType = types => {
  return types.map(type => (
    { match: { type } }
  ))
}

const matchEntities = (search, userLang) => {
  return [
    // strict (operator 'and') match on all words
    {
      multi_match: {
        query: search,
        operator: 'and',
        fields: defaultEntitiesFields(userLang),
      }
    },
    // match on some words
    {
      multi_match: {
        query: search,
        fields: flattenedTermsFields(userLang)
      }
    }
  ]
}

const defaultEntitiesFields = userLang => {
  const fields = [
    'labels.*^2',
    'aliases.*^2',
    'descriptions.*'
  ]
  if (userLang) fields.push(`labels.${userLang}^4`)
  return fields
}

const flattenedTermsFields = userLang => {
  return [
    'flattenedLabels', // text type
    'flattenedAliases', // text type
    'flattenedDescriptions', // text type
    ...defaultEntitiesFields(userLang)
  ]
}
