const { buildSearcher } = require('lib/elasticsearch')
const assert_ = require('lib/utils/assert_types')

module.exports = buildSearcher({
  dbBaseName: 'items',
  queryBuilder: params => {
    const { search, userId, limit = 10, reqUserId, allowedVisibilityKeys } = params

    assert_.string(userId)
    assert_.string(reqUserId)
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

    const should = [
      { match: { 'snapshot.entity:title': search } },
      { match: { 'snapshot.entity:subtitle': search } },
      { match: { 'snapshot.entity:authors': search } },
      { match: { 'snapshot.entity:series': search } },
      { match: { details: search } }
    ]

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
