import { isNumber } from 'lodash-es'
import { indexesNamesByBaseNames } from '#db/elasticsearch/indexes'
import { newError } from '#lib/error/error'
import { requests_ } from '#lib/requests'
import { assertString } from '#lib/utils/assert_types'
import config from '#server/config'
import type { AbsoluteUrl } from '#types/common'
import type { SearchRequest, SearchResponse } from '@elastic/elasticsearch/lib/api/types.js'

const { origin: elasticOrigin, selfSignedCertificate } = config.elasticsearch

export const elasticReqOptions = {
  ignoreCertificateErrors: elasticOrigin.startsWith('https') && selfSignedCertificate,
} as const

export function buildSearcher (params) {
  const { dbBaseName, queryBuilder } = params
  const index = indexesNamesByBaseNames[dbBaseName]
  assertString(index)

  const url = `${elasticOrigin}/${index}/_search` as AbsoluteUrl

  return async params => {
    const body: SearchRequest = queryBuilder(params)
    const { limit, offset } = params
    try {
      const res: SearchResponse = await requests_.post(url, { body, ...elasticReqOptions })
      const { hits, total } = getHitsAndTotal(res)
      let continu
      if (isNumber(limit) && isNumber(offset)) {
        continu = limit + offset
      }
      return {
        hits: hits.map(parseHit),
        total,
        continue: continu < total ? continu : undefined,
      }
    } catch (err) {
      formatError(err)
    }
  }
}

export function getHits (res) {
  checkShardError(res)
  const { hits } = res
  return hits.hits
}

export function getHitsAndTotal (res: SearchResponse) {
  checkShardError(res)
  const { hits } = res
  return {
    hits: hits.hits,
    total: typeof hits.total === 'number' ? hits.total : hits.total.value,
  }
}

export function checkShardError ({ _shards }) {
  if (_shards.failures) {
    const failure = _shards.failures[0]
    throw newError(failure.reason.reason, 500, failure)
  }
}

export const parseResponse = res => getHits(res).map(parseHit)

// Reshape the error object to be fully displayed when logged by warn
export function formatError (err) {
  // Directly rethrow errors that aren't from Elasticsearch
  // like ECONNREFUSED errors
  if (err.body == null) throw err

  err.body.error.root_cause = err.body.error.root_cause[0]
  err.body = err.body.error

  // If Elasticsearch answers with a 404,
  // it's the expected Elasticsearch index is missing
  if (err.statusCode === 404) {
    err.statusCode = 500
    if (err.body.root_cause) {
      err.message += `: ${err.body.root_cause.reason}`
      err.context = err.body.root_cause
    }
  }

  throw err
}

function parseHit (hit) {
  const { _source: data, _id, _score } = hit
  data._id = _id
  data._score = _score
  return data
}

export function getIndexedDocUrl (index, id) {
  return `${elasticOrigin}/${index}/_doc/${id}` as AbsoluteUrl
}
