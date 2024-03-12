import { isArray, map } from 'lodash-es'
import { indexesNamesByBaseNames } from '#db/elasticsearch/indexes'
import { waitForElasticsearchInit } from '#db/elasticsearch/init'
import { getIndexedDocUrl } from '#lib/elasticsearch'
import { wait } from '#lib/promises'
import { assert_ } from '#lib/utils/assert_types'
import { warn, success } from '#lib/utils/logs'
import { buildUrl } from '#lib/utils/url'
import CONFIG from '#server/config'
import { customAuthReq, rawRequest } from './request.js'
import { publicReq } from './utils.js'

const { origin: elasticOrigin, updateDelay: elasticsearchUpdateDelay } = CONFIG.elasticsearch

const endpoint = '/api/search'

await waitForElasticsearchInit()
// If Elasticsearch just started, it might answer with a "503 no_shard_available_action_exception"
// so better to wait a bit
await wait(500)

export async function getIndexedDoc (index, id, options = {}) {
  assert_.string(index)
  assert_.string(id)
  if (options) assert_.object(options)
  const { retry = true, attempt = 0 } = options
  const url = getIndexedDocUrl(index, id)
  try {
    const { body } = await rawRequest('get', url)
    return JSON.parse(body)
  } catch (err) {
    if (err.statusCode === 404) {
      if (retry && attempt < 5) {
        await wait(1000)
        return getIndexedDoc(index, id, { attempt: attempt + 1 })
      } else {
        return JSON.parse(err.context.resBody)
      }
    } else {
      throw err
    }
  }
}

export async function getAnalyze ({ indexBaseName, text, analyzer }) {
  assert_.string(indexBaseName)
  assert_.string(text)
  assert_.string(analyzer)
  const index = indexesNamesByBaseNames[indexBaseName]
  const url = `${elasticOrigin}/${index}/_analyze`
  const { body } = await rawRequest('post', url, {
    body: { text, analyzer },
  })
  return JSON.parse(body)
}

export async function getAnalyzedTokens ({ indexBaseName, text, analyzer }) {
  const analyze = await getAnalyze({ indexBaseName, text, analyzer })
  return map(analyze.tokens, 'token')
}

export async function waitForIndexation (indexBaseName, id) {
  assert_.string(indexBaseName)
  const index = indexesNamesByBaseNames[indexBaseName]
  assert_.string(index)
  assert_.string(id)
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

export async function waitForDeindexation (indexBaseName, id) {
  assert_.string(indexBaseName)
  const index = indexesNamesByBaseNames[indexBaseName]
  assert_.string(index)
  assert_.string(id)
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
  assert_.string(index)
  assert_.string(id)
  const url = `${elasticOrigin}/${index}/_doc/${id}`
  try {
    await rawRequest('delete', url)
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
  assert_.string(index)
  assert_.string(id)
  const url = `${elasticOrigin}/${index}/_doc/${id}`
  await rawRequest('put', url, { body: { testPlaceholder: true } })
  success(url, 'placeholder added')
}

export const firstNWords = (str, num) => str.split(' ').slice(0, num).join(' ')
