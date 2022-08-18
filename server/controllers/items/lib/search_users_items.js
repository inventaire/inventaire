const error_ = require('lib/error/error')
const { buildSearcher } = require('lib/elasticsearch')
const textFields = [
  'snapshot.entity:title',
  'snapshot.entity:subtitle',
  'snapshot.entity:authors',
  'snapshot.entity:series',
  'details',
]

module.exports = buildSearcher({
  dbBaseName: 'items',
  queryBuilder: params => {
    const { search, limit = 10, ownersIdsAndVisibilityKeys } = params

    if (ownersIdsAndVisibilityKeys.length === 0) {
      throw error_.new('at least one owner is required', 500, { ownersIdsAndVisibilityKeys })
    }

    const filter = docMustMatchAtLeastOneOfTheAllowedOwnerAndVisibilityKeyPairs(ownersIdsAndVisibilityKeys)

    const should = {
      multi_match: {
        type: 'cross_fields',
        analyzer: 'standard_truncated',
        fields: textFields,
        query: search,
      }
    }

    const query = {
      bool: {
        filter,
        should
      }
    }

    return { query, size: limit, min_score: 0.2 }
  }
})

const docMustMatchAtLeastOneOfTheAllowedOwnerAndVisibilityKeyPairs = ownersIdsAndVisibilityKeys => {
  return {
    bool: {
      should: ownersIdsAndVisibilityKeys.map(getOwnerClause),
      minimum_should_match: 1
    }
  }
}

const getOwnerClause = ([ ownerId, visibilityKeys ]) => {
  const clause = [
    { term: { owner: ownerId } }
  ]
  // The 'private' keyword signify that `reqUserId === ownerId`
  // and thus there is no need to check visibility keys
  if (visibilityKeys[0] !== 'private') {
    clause.push({
      terms: { visibility: visibilityKeys }
    })
  }
  return {
    bool: {
      filter: clause
    }
  }
}
