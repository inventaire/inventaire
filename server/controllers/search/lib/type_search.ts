import {
  indexesNamesByBaseNames as indexes,
  indexedTypes,
  indexedEntitiesTypes,
  socialTypes,
} from '#db/elasticsearch/indexes'
import { formatError, getHitsAndTotal } from '#lib/elasticsearch'
import { newError } from '#lib/error/error'
import { requests_ } from '#lib/requests'
import { assert_ } from '#lib/utils/assert_types'
import { someMatch } from '#lib/utils/base'
import config from '#server/config'
import type { Url } from '#types/common'
import entitiesQueryBuilder from './entities_query_builder.js'
import socialQueryBuilder from './social_query_builder.js'

const { origin: elasticOrigin } = config.elasticsearch

const indexedTypesSet = new Set(indexedTypes)

const typeSearch = async params => {
  const { lang, types, search, limit, offset, filter, exact, minScore, claim, safe = false } = params
  assert_.array(types)
  for (const type of types) {
    if (!indexedTypesSet.has(type)) throw newError('invalid type', 500, { type, types })
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
    throw newError('can not have both social and entity types', 400, { types })
  }

  let body, queryIndexes
  if (hasSocialTypes) {
    queryIndexes = types.map(type => indexes[type])
    body = socialQueryBuilder({ search, limit, minScore })
  } else {
    queryIndexes = filter ? entitiesIndexesPerFilter[filter] : allEntitiesIndexes
    if (queryIndexes == null) throw newError('invalid filter', 500, { filter })
    body = entitiesQueryBuilder({ lang, types, search, limit, offset, exact, minScore, claim, safe })
  }

  const url = `${elasticOrigin}/${queryIndexes.join(',')}/_search` as Url

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

export default typeSearch

const entitiesIndexesPerFilter = {
  wd: [ indexes.wikidata ],
  inv: [ indexes.entities ],
}
const allEntitiesIndexes = [ indexes.wikidata, indexes.entities ]

const typeParameterError = (parameter, types) => {
  const context = { givenTypes: types, validTypes: indexedEntitiesTypes }
  throw newError(`${parameter} search is restricted to entity types`, 400, context)
}
