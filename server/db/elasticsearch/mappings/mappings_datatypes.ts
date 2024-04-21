import { activeI18nLangs } from '../helpers.js'
import type { WikimediaLanguageCode } from 'wikibase-sdk'

// See https://www.elastic.co/guide/en/elasticsearch/reference/7.10/mapping-types.html

export const autocompleteText = {
  type: 'text',
  analyzer: 'autocomplete',
  // Set a different default analyzer for search time,
  // as recommanded in https://www.elastic.co/guide/en/elasticsearch/reference/7.10/analysis-edgengram-tokenizer.html#max-gram-limits
  // See: https://www.elastic.co/guide/en/elasticsearch/reference/7.10/search-analyzer.html
  search_analyzer: 'standard_truncated',
  // To be considered for next reindexation: set norms.enabled=false as in our use case,
  // the kind of term (label, alias, or description) is more important than it's length
  // See https://www.elastic.co/guide/en/elasticsearch/guide/current/scoring-theory.html
}

const fullText = {
  type: 'text',
  // This analyzer won't produce ngram tokens, and can thus be used for exact match.
  // Ex: Searching for "fruit" won't produce a hit on document with "fruitful"
  analyzer: 'standard_full',
}

type PropertiesKeys = WikimediaLanguageCode | 'fromclaims'
function getTermsProperties (datatype) {
  const properties: Partial<Record<PropertiesKeys, string>> = {}
  activeI18nLangs.forEach(lang => {
    properties[lang] = datatype
  })
  properties.fromclaims = datatype
  return properties
}

export const boolean = { type: 'boolean' }

export const date = { type: 'date' }

export const flattened = { type: 'flattened' }

export const geoPoint = { type: 'geo_point' }

export const integer = { type: 'integer' }

export const keyword = { type: 'keyword' }
// See https://www.elastic.co/guide/en/elasticsearch/reference/current/enabled.html
export const objectNotIndexed = { type: 'object', enabled: false }

export const autocompleteTerms = { properties: getTermsProperties(autocompleteText) }

export const fullTerms = { properties: getTermsProperties(fullText) }

export const flattenedTerms = autocompleteText
export const text = { type: 'text' }
// Array types are equivalent to there values type,
// see https://www.elastic.co/guide/en/elasticsearch/reference/current/array.html
// so those are just aliases for documentation purpose
export const keywordArray = { type: 'keyword' }
