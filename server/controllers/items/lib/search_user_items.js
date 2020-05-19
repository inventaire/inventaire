const CONFIG = require('config')
const __ = CONFIG.universalPath
const { buildSearcher } = __.require('lib', 'elasticsearch')
const assert_ = __.require('utils', 'assert_types')

module.exports = buildSearcher({
  dbBaseName: 'items',
  queryBodyBuilder: (search, params) => {
    const { userId, limit = 10, accessLevel } = params

    assert_.string(accessLevel)

    const must = [
      { term: { owner: userId } }
    ]

    const mustNot = mustNotByAccessLevel[accessLevel]

    const should = [
      { match: { 'snapshot.entity:title': search } },
      { match: { 'snapshot.entity:subtitle': search } },
      { match: { 'snapshot.entity:authors': search } },
      { match: { 'snapshot.entity:series': search } }
    ]

    const query = { bool: { must, must_not: mustNot, should } }

    return { query, size: limit, min_score: 0.2 }
  }
})

const mustNotByAccessLevel = {
  private: [],
  network: [
    { term: { listing: 'private' } }
  ],
  public: [
    { term: { listing: 'private' } },
    { term: { listing: 'network' } }
  ]
}
