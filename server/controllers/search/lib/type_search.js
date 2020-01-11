const CONFIG = require('config')
const __ = CONFIG.universalPath
const requests_ = __.require('lib', 'requests')
const assert_ = __.require('utils', 'assert_types')
const error_ = __.require('lib', 'error/error')
const { Promise } = __.require('lib', 'promises')
const { host: elasticHost } = CONFIG.elasticsearch
const { formatError } = __.require('lib', 'elasticsearch')
const getIndexesAndTypes = require('./get_indexes_and_types')
const queryBodyBuilder = require('./query_body_builder')

// types should be a subset of ./types possibleTypes
module.exports = (types, search, limit = 20, filter) => {
  assert_.array(types)
  assert_.string(search)

  let { indexes, types: indexesTypes } = getIndexesAndTypes(types)

  if (filter) {
    if (filter === 'wd') {
      indexes = indexes.includes('wikidata') ? [ 'wikidata' ] : []
    } else if (filter === 'inv') {
      indexes = indexes.filter(indexName => indexName !== 'wikidata')
    } else {
      throw error_.new('invalid filter', 500, { types, search, filter })
    }
  }

  if (indexes.length === 0) return Promise.resolve([])

  const url = `${elasticHost}/${indexes.join(',')}/${indexesTypes.join(',')}/_search`

  const body = queryBodyBuilder(search, limit)

  return requests_.post(url, { body })
  .catch(formatError)
}
