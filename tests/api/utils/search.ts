import { isArray, map } from 'lodash-es'
import { indexesNamesByBaseNames } from '#db/elasticsearch/indexes'
import { waitForElasticsearchInit } from '#db/elasticsearch/init'
import { elasticReqOptions, getIndexedDocUrl } from '#lib/elasticsearch'
import { newError } from '#lib/error/error'
import { wait } from '#lib/promises'
import { assertObject, assertString } from '#lib/utils/assert_types'
import { warn, success } from '#lib/utils/logs'
import { buildUrl } from '#lib/utils/url'
import config from '#server/config'
import type { AbsoluteUrl } from '#types/common'
import { customAuthReq, rawRequest } from './request.js'
import { publicReq } from './utils.js'
import type { IndexName, VersionNumber, Id } from '@elastic/elasticsearch/lib/api/types.js'

const { origin: elasticOrigin, updateDelay: elasticsearchUpdateDelay } = config.elasticsearch

const endpoint = '/api/search'

await waitForElasticsearchInit()
// If Elasticsearch just started, it might answer with a "503 no_shard_available_action_exception"
// so better to wait a bit
await wait(500)

interface GetIndexedDocOptions {
  retry?: boolean
  attempt?: number
}
export async function getIndexedDoc (index, id, options: GetIndexedDocOptions = {}) {
  assertString(index)
  assertString(id)
  if (options) assertObject(options)
  const { retry = true, attempt = 0 } = options
  const url = getIndexedDocUrl(index, id)
  try {
    const { body } = await rawRequest('get', url, elasticReqOptions)
    return JSON.parse(body)
  } catch (err) {
    if (err.statusCode === 404) {
      if (retry) {
        if (attempt < 5) {
          await wait(1000)
          return getIndexedDoc(index, id, { attempt: attempt + 1 })
        } else {
          throw newError('doc indexation timeout', 500, { index, id, options })
        }
      } else {
        return JSON.parse(err.context.resBody)
      }
    } else {
      throw err
    }
  }
}

export async function getAnalyze ({ indexBaseName, text, analyzer }) {
  assertString(indexBaseName)
  assertString(text)
  assertString(analyzer)
  const index = indexesNamesByBaseNames[indexBaseName]
  const url = `${elasticOrigin}/${index}/_analyze` as AbsoluteUrl
  const { body } = await rawRequest('post', url, {
    body: { text, analyzer },
    ...elasticReqOptions,
  })
  return JSON.parse(body)
}

export async function getAnalyzedTokens ({ indexBaseName, text, analyzer }) {
  const analyze = await getAnalyze({ indexBaseName, text, analyzer })
  return map(analyze.tokens, 'token')
}

export async function waitForIndexation (indexBaseName, id) {
  assertString(indexBaseName)
  const index = indexesNamesByBaseNames[indexBaseName]
  assertString(index)
  assertString(id)
  const { found } = await getIndexedDoc(index, id)
  if (found) {
    // Now that the doc is in ElasticSearch, let it a moment to update secondary indexes
    await wait(elasticsearchUpdateDelay)
  } else {
    warn(`waiting for ${index}/${id} indexation`)
    await wait(200)
    return waitForIndexation(indexBaseName, id)
  }
}

interface ElasticResponse {
  _index: IndexName
  _id: Id
  _version?: VersionNumber
}

export async function waitForReindexation (elasticResponse: ElasticResponse) {
  const { _index: index, _id: id, _version: version } = elasticResponse
  const { _version: newVersion } = await getIndexedDoc(index, id)
  if (newVersion !== version) {
    // Now that the doc is in ElasticSearch, let it a moment to update secondary indexes
    await wait(elasticsearchUpdateDelay)
  } else {
    warn(`waiting for ${index}/${id} reindexation`)
    await wait(200)
    return waitForReindexation(elasticResponse)
  }
}

export async function waitForDeindexation (indexBaseName, id) {
  assertString(indexBaseName)
  const index = indexesNamesByBaseNames[indexBaseName]
  assertString(index)
  assertString(id)
  const { found } = await getIndexedDoc(index, id, { retry: false })
  if (found) {
    warn(`waiting for ${index}/${id} deindexation`)
    await wait(500)
    return waitForDeindexation(indexBaseName, id)
  } else {
    // Now that the doc is in ElasticSearch, let it a moment to update secondary indexes
    await wait(elasticsearchUpdateDelay)
  }
}

export async function search (...args) {
  let types, search, lang, filter, limit, offset, exact, minScore, claim
  if (args.length === 1) ({ types, search, lang, filter, limit, offset, exact, minScore, claim } = args[0])
  else [ types, search, lang, filter ] = args
  if (isArray(types)) types = types.join('|')
  const url = buildUrl(endpoint, {
    types,
    search,
    lang: lang || 'en',
    limit: limit || 10,
    offset: offset || 0,
    exact,
    filter,
    'min-score': minScore,
    claim,
  })
  const { results } = await publicReq('get', url)
  return results
}

export async function customAuthSearch (user, types, search) {
  const { results } = await customAuthReq(user, 'get', buildUrl(endpoint, { search, types, lang: 'en' }))
  return results
}

export async function deindex (index, id) {
  assertString(index)
  assertString(id)
  const url = `${elasticOrigin}/${index}/_doc/${id}`
  try {
    await rawRequest('delete', url, elasticReqOptions)
    success(url, 'deindexed')
  } catch (err) {
    if (err.statusCode === 404) {
      warn(url, 'doc not found: no deindexation required')
    } else {
      throw err
    }
  }
}

export async function indexPlaceholder (index, id) {
  assertString(index)
  assertString(id)
  const url = `${elasticOrigin}/${index}/_doc/${id}`
  await rawRequest('put', url, { body: { testPlaceholder: true }, ...elasticReqOptions })
  success(url, 'placeholder added')
}

export const firstNWords = (str, num) => str.split(' ').slice(0, num).join(' ')
