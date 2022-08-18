const { buildSearcher } = require('lib/elasticsearch')
const assert_ = require('lib/utils/assert_types')
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
    const { search, userId, limit = 10, reqUserId, allowedVisibilityKeys } = params

    assert_.string(userId)

    if (userId !== reqUserId) assert_.array(allowedVisibilityKeys)

    const filter = [
      { term: { owner: userId } }
    ]

    if (userId !== reqUserId) {
      filter.push({
        bool: {
          should: allowedVisibilityKeys.map(buildVisibilityMatchClause),
          minimum_should_match: 1
        }
      })
    }

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

const buildVisibilityMatchClause = key => ({ match: { visibility: key } })
