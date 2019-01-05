CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
requests_ = __.require 'lib', 'requests'
assert_ = __.require 'utils', 'assert_types'
{ host:elasticHost } = CONFIG.elasticsearch
{ formatError } = __.require 'lib', 'elasticsearch'
getIndexesAndTypes = require './get_indexes_and_types'
queryBodyBuilder = require './query_body_builder'

# types should be a subset of ./types possibleTypes
module.exports = (types, search)->
  assert_.array types
  assert_.string search

  { indexes, types } = getIndexesAndTypes types

  url = "#{elasticHost}/#{indexes.join(',')}/#{types.join(',')}/_search"

  body = queryBodyBuilder search, 20

  return requests_.post { url, body }
  .catch formatError
