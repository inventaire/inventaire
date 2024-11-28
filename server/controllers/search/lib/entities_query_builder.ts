import { trim } from 'lodash-es'
import { languageCodePattern, languagesCodesProperties } from '#controllers/entities/lib/languages'
import { prefixifyWdProperty } from '#controllers/entities/lib/prefix'
import { propertiesValuesConstraints as properties } from '#controllers/entities/lib/properties/properties_values_constraints'
import { isPropertyUri, isWdEntityUri } from '#lib/boolean_validations'
import { newError } from '#lib/error/error'
import { getSingularTypes } from '#lib/wikidata/aliases'
import { allowlistedProperties } from '#lib/wikidata/allowlisted_properties'
import type { PropertyUri } from '#types/entity'

const prefixedAllowlistedProperties: PropertyUri[] = allowlistedProperties.map(prefixifyWdProperty)

const allowedProperties = new Set(prefixedAllowlistedProperties)

export default params => {
  const { lang: userLang, search, limit: size, offset: from, exact, claim, safe = false } = params
  let { types, minScore = 0.5 } = params
  types = getSingularTypes(types)

  const filters = [
    // At least one type should match
    // See https://www.elastic.co/guide/en/elasticsearch/reference/7.10/query-dsl-terms-query.html
    { terms: { type: types } },
  ]

  if (claim) filters.push(...getClaimFilters(claim))

  if (!search) minScore = 0

  const shoulds = matchEntities(search, userLang, exact, safe)
  if (types.includes('language') && languageCodePattern.test(search)) {
    shoulds.push(matchLanguageCode(search))
  }

  return {
    query: {
      function_score: {
        query: {
          bool: {
            filter: filters,
            should: shoulds,
            // The default value would be 0 due to the presence of filters
            // See https://www.elastic.co/guide/en/elasticsearch/reference/current/query-dsl-bool-query.html#bool-min-should-match
            minimum_should_match: shoulds.length > 0 ? 1 : 0,
          },
        },
        // See: https://www.elastic.co/guide/en/elasticsearch/reference/7.10/query-dsl-function-score-query.html#function-field-value-factor
        field_value_factor: {
          field: 'popularity',
          // Inspired by https://www.elastic.co/guide/en/elasticsearch/guide/current/boosting-by-popularity.html
          modifier: 'ln2p',
          missing: 1,
        },
      },
    },
    from,
    size,
    min_score: minScore,
  }
}

function matchEntities (search, userLang, exact, safe) {
  const shoulds = []
  if (search == null) return shoulds

  shoulds.push({
    multi_match: {
      query: search,
      operator: 'and',
      fields: exactMatchEntitiesFields(userLang),
      analyzer: 'standard_full',
      type: 'best_fields',
      boost: 10,
    },
  })

  if (!exact) {
    shoulds.push({
      multi_match: {
        query: search,
        operator: 'or',
        fields: autoCompleteEntitiesFields(userLang),
        analyzer: 'standard_truncated',
        // From time to time, cross_fields generates 'function score query returned an invalid score' errors
        // See https://github.com/elastic/elasticsearch/issues/44700
        // So, until there is a fix for that, requests that generate those errors will be retried in "safe" mode,
        // that is, with best_fields instead of cross_fields
        type: safe ? 'best_fields' : 'cross_fields',
      },
    })
  }

  return shoulds
}

function exactMatchEntitiesFields (userLang) {
  const fields = [
    'fullLabels.*^2',
    'fullAliases.*',
  ]
  if (userLang) {
    fields.push(
      `fullLabels.${userLang}^4`,
      `fullAliases.${userLang}^2`
    )
  }
  return fields
}

function autoCompleteEntitiesFields (userLang) {
  const fields = [
    'labels.*^2',
    'aliases.*',
    'flattenedLabels^0.5',
    'flattenedAliases^0.5',
    'descriptions.*^0.5',
    'flattenedDescriptions^0.5',
    'relationsTerms',
  ]
  if (userLang) {
    fields.push(
      `labels.${userLang}^4`,
      `aliases.${userLang}^2`
    )
  }
  return fields
}

function getClaimFilters (claimParameter) {
  return claimParameter
  .split(' ')
  .map(andCondition => {
    const orConditions = andCondition.split('|').map(trim)
    orConditions.forEach(validatePropertyAndValue)
    return {
      terms: {
        claim: orConditions,
      },
    }
  })
}

function validatePropertyAndValue (condition) {
  const [ property, value ] = condition.split('=')
  if (!isPropertyUri(property)) {
    throw newError('invalid property', 400, { property })
  }
  if (!allowedProperties.has(property)) {
    throw newError('unknown property', 400, { property, value })
  }
  // Using a custom validation for wdt:P31, to avoid having to pass an entityType
  if (property === 'wdt:P31') {
    if (!isWdEntityUri(value)) {
      throw newError('invalid property value', 400, { property, value })
    }
  } else {
    // Some allowed properties do not have a validation function
    if (properties[property]) {
      if (!properties[property].validate({ value })) {
        throw newError('invalid property value', 400, { property, value })
      }
    }
  }
}

function matchLanguageCode (search) {
  search = search.toLowerCase()
  const claimTerms = languagesCodesProperties.map(property => `${property}=${search}`)
  return {
    terms: {
      claim: claimTerms,
      boost: 1000,
    },
  }
}
