const _ = require('builders/utils')
const requests_ = require('lib/requests')
const error_ = require('lib/error/error')
const assert_ = require('lib/utils/assert_types')
const { host: elasticHost } = require('config').elasticsearch
const { getHits, formatError } = require('lib/elasticsearch')
const { indexes, indexedTypes, indexedEntitiesTypes } = require('./indexes')
const indexedTypesSet = new Set(indexedTypes)
const entitiesQueryBuilder = require('./entities_query_builder')
const socialQueryBuilder = require('./social_query_builder')

module.exports = async ({ lang, types, search, limit = 20, filter, exact, minScore }) => {
  assert_.array(types)
  for (const type of types) {
    if (!indexedTypesSet.has(type)) throw error_.new('invalid type', 500, { type, types })
  }
  assert_.string(search)

  const hasSocialTypes = types.includes('users') || types.includes('groups')
  const hasEntityTypes = _.someMatch(types, indexedEntitiesTypes)

  if (hasSocialTypes && exact) {
    throw error_.new('exact search is restricted to entity types', 400, { givenTypes: types, validTypes: indexedEntitiesTypes })
  }

  // Query must be either social (user, group) or entities related
  // but cannot be both as results scores are built very differently
  if (hasSocialTypes && hasEntityTypes) {
    throw error_.new('can not have both social and entity types', 400, { types })
  }

  let body, queryIndexes
  if (hasSocialTypes) {
    queryIndexes = types.map(type => indexes[type])
    body = socialQueryBuilder({ search, limit, minScore })
  } else {
    queryIndexes = entitiesIndexesPerFilter[filter]
    if (queryIndexes == null) throw error_.new('invalid filter', 500, { filter })
    body = entitiesQueryBuilder({ lang, types, search, limit, exact, minScore })
  }

  const url = `${elasticHost}/${queryIndexes.join(',')}/_search`

  return requests_.post(url, { body })
  .then(getHits)
  .catch(formatError)
}

const entitiesIndexesPerFilter = {
  wd: [ indexes.wikidata ],
  inv: [ indexes.entities ],
  [undefined]: [ indexes.wikidata, indexes.entities ],
}
