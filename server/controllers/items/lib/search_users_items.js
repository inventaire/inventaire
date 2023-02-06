import { buildSearcher } from '#lib/elasticsearch'
import { error_ } from '#lib/error/error'

const textFields = [
  'snapshot.entity:title',
  'snapshot.entity:subtitle',
  'snapshot.entity:authors',
  'snapshot.entity:series',
  'details',
]

export default buildSearcher({
  dbBaseName: 'items',
  queryBuilder: params => {
    const { search, limit = 10, ownersIdsAndVisibilityKeys, shelfId } = params

    if (ownersIdsAndVisibilityKeys.length === 0) {
      throw error_.new('at least one owner is required', 500, { ownersIdsAndVisibilityKeys })
    }

    const filter = [
      buildOwnerAndVisibilityKeysClauses(ownersIdsAndVisibilityKeys),
    ]

    if (shelfId) {
      filter.push({ term: { shelves: shelfId } })
    }

    const should = {
      multi_match: {
        type: 'cross_fields',
        analyzer: 'standard_truncated',
        fields: textFields,
        query: search,
      },
    }

    const query = {
      bool: {
        filter,
        should,
      },
    }

    return { query, size: limit, min_score: 0.2 }
  },
})

const buildOwnerAndVisibilityKeysClauses = ownersIdsAndVisibilityKeys => {
  return {
    bool: {
      should: ownersIdsAndVisibilityKeys.map(buildOwnerFilterClause),
      minimum_should_match: 1,
    },
  }
}

const buildOwnerFilterClause = ([ ownerId, visibilityKeys ]) => {
  const filter = [
    { term: { owner: ownerId } },
  ]
  // The 'private' keyword signify that `reqUserId === ownerId`
  // and thus there is no need to check visibility keys
  if (visibilityKeys[0] !== 'private') {
    filter.push({
      terms: { visibility: visibilityKeys },
    })
  }
  return {
    bool: {
      filter,
    },
  }
}
