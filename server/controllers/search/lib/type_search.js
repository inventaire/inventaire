const requests_ = require('lib/requests')
const error_ = require('lib/error/error')
const assert_ = require('lib/utils/assert_types')
const { origin: elasticOrigin } = require('config').elasticsearch
const { formatError, getHitsAndTotal } = require('lib/elasticsearch')
const { indexesNamesByBaseNames: indexes, indexedTypes, indexedEntitiesTypes, socialTypes } = require('db/elasticsearch/indexes')
const indexedTypesSet = new Set(indexedTypes)
const entitiesQueryBuilder = require('./entities_query_builder')
const socialQueryBuilder = require('./social_query_builder')
const { someMatch } = require('lib/utils/base')

const typeSearch = async params => {
  const { lang, types, search, limit, offset, filter, exact, minScore, claim, safe = false } = params
  assert_.array(types)
  for (const type of types) {
    if (!indexedTypesSet.has(type)) throw error_.new('invalid type', 500, { type, types })
  }
  if (search) assert_.string(search)

  const hasSocialTypes = someMatch(types, socialTypes)
  const hasEntityTypes = someMatch(types, indexedEntitiesTypes)

  if (hasSocialTypes) {
    if (exact) typeParameterError('exact', types)
    if (claim != null) typeParameterError('exact', types)
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
    body = entitiesQueryBuilder({ lang, types, search, limit, offset, exact, minScore, claim, safe })
  }

  const url = `${elasticOrigin}/${queryIndexes.join(',')}/_search`

  return requests_.post(url, { body })
  .then(getHitsAndTotal)
  .catch(formatError)
  .catch(err => {
    if (safe) {
      throw err
    } else {
      params.safe = true
      return typeSearch(params)
    }
  })
}

module.exports = typeSearch

const entitiesIndexesPerFilter = {
  wd: [ indexes.wikidata ],
  inv: [ indexes.entities ],
  [undefined]: [ indexes.wikidata, indexes.entities ],
}

const typeParameterError = (parameter, types) => {
  const context = { givenTypes: types, validTypes: indexedEntitiesTypes }
  throw error_.new(`${parameter} search is restricted to entity types`, 400, context)
}
