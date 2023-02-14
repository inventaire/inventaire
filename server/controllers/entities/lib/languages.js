import CONFIG from 'config'
import wdk from 'wikidata-sdk'
import { nonPrefixedImageProperties } from '#controllers/entities/lib/get_commons_filenames_from_claims'
import { prefixifyWd } from '#controllers/entities/lib/prefix'
import { matchEntities } from '#controllers/search/lib/entities_query_builder'
import normalizeResult from '#controllers/search/lib/normalize_result'
import { isWdEntityUri } from '#lib/boolean_validations'
import { formatError, getHitsAndTotal } from '#lib/elasticsearch'
import { requests_ } from '#lib/requests'

const { origin: elasticOrigin } = CONFIG.elasticsearch

const languagesCodesProperties = [
  'P218', // ISO 639-1 code
  'P219', // ISO 639-2 code
  'P220', // ISO 639-3 code
  'P221', // ISO 639-6 code
  'P424', // Wikimedia language code
  'P1798', // ISO 639-5 code
  'P9753', // Wikidata language code
]

export const languagesProperties = languagesCodesProperties.concat(nonPrefixedImageProperties)

export async function searchLanguages ({ search, lang, limit, offset }) {
  const url = `${elasticOrigin}/languages/_search`
  const body = languagesQueryBuilder({ search, lang, limit, offset })

  const { hits } = await requests_.post(url, { body })
    .then(getHitsAndTotal)
    .catch(formatError)

  // Required downstream to find the appropriate search result formatter
  hits.forEach(setHitType)

  return hits.map(normalizeResult(lang))
}

const setHitType = hit => {
  hit._source.type = 'language'
}

function languagesQueryBuilder ({ search, lang, limit, offset }) {
  let shoulds = []

  let uri
  if (wdk.isItemId(search)) uri = prefixifyWd(search)
  else if (isWdEntityUri(search)) uri = search

  if (uri) {
    // Equivalent to getting the entity by uri,
    // but allows to easily return the same output as non-uri queries
    shoulds.push(matchUri(uri))
  } else {
    shoulds = matchEntities({ search, lang })
    if (codePattern.test(search)) {
      shoulds.push(matchLanguageCode(search))
    }
  }

  return {
    query: {
      bool: {
        should: shoulds,
      },
    },
    size: limit,
    from: offset,
    min_score: 1,
  }
}

function matchLanguageCode (search) {
  search = search.toLowerCase()
  const claimTerms = languagesCodesProperties.map(property => `wdt:${property}=${search}`)
  return {
    terms: {
      claim: claimTerms,
      boost: 100,
    },
  }
}

const codePattern = /^[\w-_]+$/

function matchUri (uri) {
  return {
    term: {
      uri: {
        value: uri,
        boost: 100,
      },
    },
  }
}
