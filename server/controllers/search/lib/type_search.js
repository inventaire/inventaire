const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')
const requests_ = __.require('lib', 'requests')
const error_ = __.require('lib', 'error/error')
const assert_ = __.require('utils', 'assert_types')
const { host: elasticHost } = CONFIG.elasticsearch
const { getHits, formatError } = __.require('lib', 'elasticsearch')
const { indexes, indexedTypes, indexedEntitiesTypes, localAndRemoteEntitiesTypes } = require('./indexes')
const indexedTypesSet = new Set(indexedTypes)
const entitiesQueryBuilder = require('./entities_query_builder')
const socialQueryBuilder = require('./social_query_builder')

module.exports = async ({ lang, types, search, limit = 20 }) => {
  assert_.array(types)
  for (const type of types) {
    if (!indexedTypesSet.has(type)) throw error_.new('invalid type', 500, { type, types })
  }
  assert_.string(search)

  const hasSocialTypes = types.includes('users') || types.includes('groups')
  const hasEntityTypes = _.someMatch(types, indexedEntitiesTypes)

  // Query must be either social (user, group) or entities related
  // but cannot be both as results scores are built very differently
  if (hasSocialTypes && hasEntityTypes) {
    throw error_.new('can not have both social and entity types', 400, { types })
  }

  let body, queryIndexes
  if (hasSocialTypes) {
    queryIndexes = types.map(type => indexes[type])
    body = socialQueryBuilder(search)
  } else {
    queryIndexes = [ indexes.wikidata ]
    if (localAndRemoteEntitiesTypes) queryIndexes.push(indexes.entities)
    body = entitiesQueryBuilder({ lang, types, search, limit })
  }

  const url = `${elasticHost}/${queryIndexes.join(',')}/_search`

  return requests_.post(url, { body })
  .then(getHits)
  .catch(formatError)
}
