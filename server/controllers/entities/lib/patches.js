// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const __ = require('config').universalPath
const _ = __.require('builders', 'utils')
const designDocName = 'patches'
const db = __.require('couch', 'base')('patches', designDocName)
const Patch = __.require('models', 'patch')
const Entity = __.require('models', 'entity')
const promises_ = __.require('lib', 'promises')
const assert_ = __.require('utils', 'assert_types')
const { maxKey } = __.require('lib', 'couch')
const { oneDay } = __.require('lib', 'times')

module.exports = {
  db,
  byId: db.get,
  byEntityId: entityId => db.viewByKeys('byEntityId', [ entityId ]),
  byEntityIds: entityIds => db.viewByKeys('byEntityId', entityIds),
  byUserId: (userId, limit, offset) => {
    return promises_.all([
      db.view(designDocName, 'byUserId', {
        startkey: [ userId, maxKey ],
        endkey: [ userId ],
        descending: true,
        limit,
        skip: offset,
        include_docs: true,
        reduce: false
      }),
      // Unfortunately, the response doesn't gives the total range length
      // so we need to query it separately
      getUserTotalContributions(userId)
    ])
    .spread((res, total) => {
      const data = {
        patches: _.map(res.rows, 'doc'),
        total
      }
      const rangeEnd = offset + limit
      if (rangeEnd < total) { data.continue = rangeEnd }
      return data
    })
  },

  byRedirectUri: db.viewByKey.bind(null, 'byRedirectUri'),

  create: params => {
    return promises_.try(() => Patch.create(params))
    .then(db.postAndReturn)
  },

  getSnapshots: entityId => {
    return byEntityId(entityId)
    .then(patchDocs => {
      const base = Entity.create()
      return Patch.getSnapshots(base, patchDocs)
    })
  },

  getGlobalActivity: () => {
    return db.view(designDocName, 'byUserId', { group_level: 1 })
    .get('rows')
    .map(formatRow)
    .then(sortAndFilterContributions)
    // Return only the first hundred results
    .then(rows => rows.slice(0, 100))
  },

  getActivityFromLastDay: days => {
    assert_.number(days)
    const now = Date.now()
    const startTime = now - (oneDay * days)
    const today = _.simpleDay()
    const startDay = _.simpleDay(startTime)
    return db.view(designDocName, 'byDay', {
      group_level: 2,
      startkey: [ startDay ],
      endkey: [ today, maxKey ]
    })
    .get('rows')
    .then(rows => convertToArray(rows.reduce(aggregatePeriodContributions, {})))
    .then(activity => ({
      activity,
      start: startDay,
      end: today
    }))
  }
}

const byEntityId = entityId => db.viewByKey('byEntityId', entityId)

const formatRow = row => ({
  user: row.key[0],
  contributions: row.value
})

const aggregatePeriodContributions = (counts, row) => {
  const userId = row.key[1]
  const contributions = row.value
  if (counts[userId] == null) { counts[userId] = 0 }
  counts[userId] += contributions
  return counts
}

const convertToArray = counts => {
  const data = []
  for (const userId in counts) {
    const contributions = counts[userId]
    data.push({ user: userId, contributions })
  }
  return sortAndFilterContributions(data)
}

const sortAndFilterContributions = rows => rows
.filter(noSpecialUser)
.sort((a, b) => b.contributions - a.contributions)

// Filtering-out special users automated contributions
// see server/db/couch/hard_coded_documents.js
const noSpecialUser = row => !row.user.startsWith('000000000000000000000000000000')

const getUserTotalContributions = userId => db.view(designDocName, 'byUserId', {
  group_level: 1,
  // Maybe there is a way to only pass the userId key
  // but I couln't find it
  startkey: [ userId ],
  endkey: [ userId, maxKey ]
})
// Testing the row existance in case we got an invalid user id
.then(res => (res.rows[0] != null ? res.rows[0].value : undefined) || 0)
