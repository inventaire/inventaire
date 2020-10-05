const CONFIG = require('config')
const __ = CONFIG.universalPath
const requests_ = __.require('lib', 'requests')
const assert_ = __.require('utils', 'assert_types')
const { host: elasticHost } = CONFIG.elasticsearch
const { formatError } = __.require('lib', 'elasticsearch')
const getIndexesAndTypes = require('./get_indexes_and_types')
const entitiesQueryBuilder = require('./entities_query_builder')
const socialQueryBuilder = require('./social_query_builder')

// types should be a subset of ./types possibleTypes
module.exports = ({ lang, types, search, limit = 20 }) => {
  let indexes
  assert_.array(types)
  assert_.string(search);

  ({ indexes, types } = getIndexesAndTypes(types))

  const url = `${elasticHost}/${indexes.join(',')}/_search`
  let body = {}

  // query must be either social (user, group) or entities related
  // but cannot be both as results scores are built very differently
  if (types.includes('user') || types.includes('group')) {
    body = socialQueryBuilder(search)
  } else {
    body = entitiesQueryBuilder({ lang, types, search, limit })
  }

  return requests_.post(url, { body })
  .catch(formatError)
}
