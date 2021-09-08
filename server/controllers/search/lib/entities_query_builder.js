const { getSingularTypes } = require('lib/wikidata/aliases')
const properties = require('controllers/entities/lib/properties/properties_values_constraints')
const error_ = require('lib/error/error')
const { trim } = require('lodash')
const { isPropertyUri, isWdEntityUri } = require('lib/boolean_validations')

module.exports = params => {
  const { lang: userLang, search, limit: size, exact, claim, safe = false } = params
  let { types, minScore = 1 } = params
  types = getSingularTypes(types)

  const filters = [
    // At least one type should match
    // See https://www.elastic.co/guide/en/elasticsearch/reference/7.10/query-dsl-terms-query.html
    { terms: { type: types } }
  ]

  if (claim) filters.push(...getClaimFilters(claim))

  if (!search) minScore = 0

  const shoulds = matchEntities(search, userLang, exact, safe)

  return {
    query: {
      function_score: {
        query: {
          bool: {
            filter: filters,
            should: shoulds,
            // The default value would be 0 due to the presence of filters
            // See https://www.elastic.co/guide/en/elasticsearch/reference/current/query-dsl-bool-query.html#bool-min-should-match
            minimum_should_match: shoulds != null ? 1 : 0
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

const matchEntities = (search, userLang, exact, safe) => {
  // In case a claim alone is searched
  if (search == null) return

  const fields = entitiesFields(userLang, exact)

  // From time to time, cross_fields generates 'function score query returned an invalid score' errors
  // See https://github.com/elastic/elasticsearch/issues/44700
  // So, until there is a fix for that, requests that generate those errors will be retried in "safe" mode,
  // that is, with best_fields instead of cross_fields
  const matchType = safe ? 'best_fields' : 'cross_fields'

  const queries = [
    {
      // Use query_string to give exact matches a boost.
      // See query strings doc : https://www.elastic.co/guide/en/elasticsearch/reference/7.10/query-dsl-query-string-query.html
      multi_match: {
        query: search,
        operator: 'and',
        fields,
        analyzer: 'standard_truncated',
        type: matchType,
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
        type: matchType,
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
      'flattenedDescriptions^0.25',
      'relationsTerms^0.25'
    )
  }

  return fields
}

const getClaimFilters = claimParameter => {
  return claimParameter
  .split(' ')
  .map(andCondition => {
    const orConditions = andCondition.split('|').map(trim)
    orConditions.forEach(validatePropertyAndValue)
    return {
      terms: {
        claim: orConditions
      }
    }
  })
}

const validatePropertyAndValue = condition => {
  const [ property, value ] = condition.split('=')
  if (!isPropertyUri(property)) {
    throw error_.new('invalid property', 400, { property })
  }
  if (properties[property] == null) {
    throw error_.new('unknown property', 400, { property, value })
  }
  // Using a custom validation for wdt:P31, to avoid having to pass an entityType
  if (property === 'wdt:P31') {
    if (!isWdEntityUri(value)) {
      throw error_.new('invalid property value', 400, { property, value })
    }
  } else {
    if (!properties[property].validate(value)) {
      throw error_.new('invalid property value', 400, { property, value })
    }
  }
}
