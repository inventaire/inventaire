const CONFIG = require('config')
const _ = require('builders/utils')
const { wait } = require('lib/promises')
const { publicReq } = require('../utils/utils')
const { host: elasticHost, updateDelay: elasticsearchUpdateDelay } = CONFIG.elasticsearch
const { rawRequest } = require('./request')
const assert_ = require('lib/utils/assert_types')
const { indexesNamesByBaseNames } = require('db/elasticsearch/indexes')

const endpoint = '/api/search'

const getIndexedDoc = async (index, id, options = {}) => {
  assert_.string(index)
  assert_.string(id)
  if (options) assert_.object(options)
  const { retry = true, attempt = 0 } = options
  const url = `${elasticHost}/${index}/_doc/${id}`
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

const getAnalyze = async ({ indexBaseName, text, analyzer }) => {
  assert_.string(indexBaseName)
  assert_.string(text)
  assert_.string(analyzer)
  const index = indexesNamesByBaseNames[indexBaseName]
  const url = `${elasticHost}/${index}/_analyze`
  const { body } = await rawRequest('post', url, {
    body: { text, analyzer }
  })
  return JSON.parse(body)
}

const getAnalyzedTokens = async ({ indexBaseName, text, analyzer }) => {
  const analyze = await getAnalyze({ indexBaseName, text, analyzer })
  return _.map(analyze.tokens, 'token')
}

const waitForIndexation = async (indexBaseName, id) => {
  assert_.string(indexBaseName)
  const index = indexesNamesByBaseNames[indexBaseName]
  assert_.string(index)
  assert_.string(id)
  const { found } = await getIndexedDoc(index, id)
  if (found) {
    // Now that the doc is in ElasticSearch, let it a moment to update secondary indexes
    await wait(elasticsearchUpdateDelay)
  } else {
    _.warn(`waiting for ${index}/${id} indexation`)
    await wait(500)
    return waitForIndexation(indexBaseName, id)
  }
}

const waitForDeindexation = async (indexBaseName, id) => {
  assert_.string(indexBaseName)
  const index = indexesNamesByBaseNames[indexBaseName]
  assert_.string(index)
  assert_.string(id)
  const { found } = await getIndexedDoc(index, id, { retry: false })
  if (found) {
    _.warn(`waiting for ${index}/${id} deindexation`)
    await wait(500)
    return waitForDeindexation(indexBaseName, id)
  } else {
    // Now that the doc is in ElasticSearch, let it a moment to update secondary indexes
    await wait(elasticsearchUpdateDelay)
  }
}

module.exports = {
  search: async (...args) => {
    let types, search, lang, filter, limit, exact, minScore, claim
    if (args.length === 1) ({ types, search, lang, filter, limit, exact, minScore, claim } = args[0])
    else [ types, search, lang, filter ] = args
    lang = lang || 'en'
    limit = limit || 10
    exact = exact || false
    if (_.isArray(types)) types = types.join('|')
    let url = `${endpoint}?types=${types}&lang=${lang}&limit=${limit}&exact=${exact}`
    if (search) url += `&search=${encodeURIComponent(search)}`
    if (filter) url += `&filter=${filter}`
    if (minScore) url += `&min-score=${minScore}`
    if (claim) url += `&claim=${encodeURIComponent(claim)}`
    const { results } = await publicReq('get', url)
    return results
  },

  getIndexedDoc,

  getAnalyze,
  getAnalyzedTokens,

  waitForIndexation,
  waitForDeindexation,

  deindex: async (index, id) => {
    assert_.string(index)
    assert_.string(id)
    const url = `${elasticHost}/${index}/_doc/${id}`
    try {
      await rawRequest('delete', url)
      _.success(url, 'deindexed')
    } catch (err) {
      if (err.statusCode === 404) {
        _.warn(url, 'doc not found: no deindexation required')
      } else {
        throw err
      }
    }
  },

  indexPlaceholder: async (index, id) => {
    assert_.string(index)
    assert_.string(id)
    const url = `${elasticHost}/${index}/_doc/${id}`
    await rawRequest('put', url, { body: { testPlaceholder: true } })
    _.success(url, 'placeholder added')
  }
}
