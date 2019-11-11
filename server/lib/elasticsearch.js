/* eslint-disable
    prefer-const,
*/
// TODO: This file was created by bulk-decaffeinate.
// Fix any style issues and re-enable lint.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const CONFIG = require('config')
const __ = require('config').universalPath
const _ = __.require('builders', 'utils')
const requests_ = __.require('lib', 'requests')
const assert_ = __.require('utils', 'assert_types')
const { host:elasticHost } = CONFIG.elasticsearch

const buildSearcher = function(params){
  let { index, dbBaseName, queryBodyBuilder } = params
  if (!index) { index = CONFIG.db.name(dbBaseName) }

  const url = `${elasticHost}/${index}/_search`

  return function(query, type, limit){
    let customUrl
    assert_.string(query)

    if (_.isNonEmptyString(type)) {
      customUrl = url.replace('_search', `${type}/_search`)
    } else {
      customUrl = url
    }

    const body = queryBodyBuilder(query, limit)

    return requests_.post({ url: customUrl, body })
    .then(parseResponse)
    .catch(formatError)
    .catch(_.ErrorRethrow(`${index} ${type} search err`))
  }
}

var parseResponse = res => res.hits.hits.map(parseHit)

// Reshape the error object to be fully displayed when logged by _.warn
var formatError = function(err){
  // Directly rethrow errors that aren't from ElasticSearch
  // like ECONNREFUSED errors
  if (err.body == null) throw err

  err.body.error.root_cause = err.body.error.root_cause[0]
  err.body = err.body.error
  throw err
}

var parseHit = function(hit){
  const { _source:data, _id, _score } = hit
  data._id = _id
  data._score = _score
  return data
}

module.exports = { buildSearcher, parseResponse, formatError }
