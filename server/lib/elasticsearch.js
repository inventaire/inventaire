const CONFIG = require('config')
const __ = require('config').universalPath
const _ = __.require('builders', 'utils')
const requests_ = __.require('lib', 'requests')
const assert_ = __.require('utils', 'assert_types')
const { host: elasticHost } = CONFIG.elasticsearch

const buildSearcher = params => {
  let { index, dbBaseName, queryBodyBuilder } = params
  if (!index) { index = CONFIG.db.name(dbBaseName) }

  const url = `${elasticHost}/${index}/_search`

  return (query, params = {}) => {
    assert_.string(query)
    const { type } = params

    let customUrl
    if (_.isNonEmptyString(type)) {
      customUrl = url.replace('_search', `${type}/_search`)
    } else {
      customUrl = url
    }

    const body = queryBodyBuilder(query, params)

    return requests_.post(customUrl, { body })
    .then(parseResponse)
    .catch(formatError)
    .catch(_.ErrorRethrow(`${index} ${type} search err`))
  }
}

const parseResponse = res => res.hits.hits.map(parseHit)

// Reshape the error object to be fully displayed when logged by _.warn
const formatError = err => {
  // Directly rethrow errors that aren't from ElasticSearch
  // like ECONNREFUSED errors
  if (err.body == null) throw err

  err.body.error.root_cause = err.body.error.root_cause[0]
  err.body = err.body.error

  // If ElasticSearch answers with a 404,
  // it's the expected ElasticSearch index is missing
  if (err.statusCode === 404) {
    err.statusCode = 500
    if (err.body.root_cause) {
      err.message += `: ${err.body.root_cause.reason}`
      err.context = err.body.root_cause
    }
  }

  throw err
}

const parseHit = hit => {
  const { _source: data, _id, _score } = hit
  data._id = _id
  data._score = _score
  return data
}

module.exports = { buildSearcher, parseResponse, formatError }
