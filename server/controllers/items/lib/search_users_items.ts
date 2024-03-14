import { buildSearcher } from '#lib/elasticsearch'
import { newError } from '#lib/error/error'
import type { QueryDslBoolQuery, QueryDslQueryContainer } from '@elastic/elasticsearch/lib/api/types.js'

const textFields = [
  'snapshot.entity:title',
  'snapshot.entity:subtitle',
  'snapshot.entity:authors',
  'snapshot.entity:series',
  'details',
]

export const searchUsersItems = buildSearcher({
  dbBaseName: 'items',
  queryBuilder: params => {
    const {
      search,
      limit = 10,
      offset = 0,
      ownersIdsAndVisibilityKeys,
      shelfId,
    } = params

    if (ownersIdsAndVisibilityKeys.length === 0) {
      throw newError('at least one owner is required', 500, { ownersIdsAndVisibilityKeys })
    }

    const filter: QueryDslQueryContainer[] = [
      buildOwnerAndVisibilityKeysClauses(ownersIdsAndVisibilityKeys),
    ]

    if (shelfId) {
      filter.push({ term: { shelves: shelfId } })
    }

    const should: QueryDslQueryContainer = {
      multi_match: {
        type: 'cross_fields',
        analyzer: 'standard_truncated',
        fields: textFields,
        query: search,
      },
    }

    const query: QueryDslQueryContainer = {
      bool: {
        filter,
        should,
      },
    }

    return { query, size: limit, from: offset, min_score: 0.2 }
  },
})

const buildOwnerAndVisibilityKeysClauses = ownersIdsAndVisibilityKeys => {
  const should: QueryDslQueryContainer[] = ownersIdsAndVisibilityKeys.map(buildOwnerFilterClause)
  const bool: QueryDslBoolQuery = {
    should,
    minimum_should_match: 1,
  }
  return { bool }
}

const buildOwnerFilterClause = ([ ownerId, visibilityKeys ]) => {
  const filter: QueryDslQueryContainer[] = [
    { term: { owner: ownerId } },
  ]
  // The 'private' keyword signify that `reqUserId === ownerId`
  // and thus there is no need to check visibility keys
  if (visibilityKeys[0] !== 'private') {
    filter.push({
      terms: { visibility: visibilityKeys },
    })
  }
  // @ts-ignore somehow, the "should" assertion library is leaking global types
  // defined in node_modules/should/should.d.ts, which conflict with ES types here
  // (Using ts-ignore instead of ts-expect error, as the build doesn't find the same error)
  const bool: QueryDslBoolQuery = { filter }
  return { bool }
}
