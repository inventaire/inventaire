const __ = require('config').universalPath
const _ = __.require('builders', 'utils')
const designDocName = 'patches'
const db = __.require('couch', 'base')('patches', designDocName)
const Patch = __.require('models', 'patch')
const Entity = __.require('models', 'entity')
const assert_ = __.require('utils', 'assert_types')
const { maxKey } = __.require('lib', 'couch')
const { oneDay } = __.require('lib', 'time')

const getUserTotalContributions = userId => {
  return db.view(designDocName, 'byUserId', {
    group_level: 1,
    // Maybe there is a way to only pass the userId key
    // but I couln't find it
    startkey: [ userId ],
    endkey: [ userId, maxKey ]
  })
  // Testing the row existance in case we got an invalid user id
  .then(res => {
    const userRow = res.rows[0]
    return userRow ? userRow.value : 0
  })
}

module.exports = {
  db,
  byId: db.get,
  byEntityId: entityId => db.viewByKeys('byEntityId', [ entityId ]),
  byEntityIds: entityIds => db.viewByKeys('byEntityId', entityIds),
  byUserId: async (userId, limit, offset) => {
    const [ viewRes, total ] = await Promise.all([
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

    return formatPatchesPage({ viewRes, total, limit, offset })
  },

  getUserTotalContributions,

  byDate: async (limit, offset) => {
    const viewRes = await db.view(designDocName, 'byDate', {
      limit,
      skip: offset,
      descending: true,
      include_docs: true
    })
    return formatPatchesPage({ viewRes, limit, offset })
  },

  byRedirectUri: db.viewByKey.bind(null, 'byRedirectUri'),

  create: async params => {
    const patch = Patch.create(params)
    return db.postAndReturn(patch)
  },

  getWithSnapshots: async entityId => {
    const patches = await byEntityId(entityId)
    const base = Entity.create()
    Patch.addSnapshots(base, patches)
    return patches
  },

  getGlobalActivity: async () => {
    let { rows } = await db.view(designDocName, 'byUserId', { group_level: 1 })
    rows = rows.map(formatRow)
    return sortAndFilterContributions(rows)
    // Return only the first hundred results
    .slice(0, 100)
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
    .then(({ rows }) => rows)
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

const sortAndFilterContributions = rows => {
  return rows
  .filter(noSpecialUser)
  .sort((a, b) => b.contributions - a.contributions)
}

// Filtering-out special users automated contributions
// see server/db/couch/hard_coded_documents.js
const noSpecialUser = row => !row.user.startsWith('000000000000000000000000000000')

const formatPatchesPage = ({ viewRes, total, limit, offset }) => {
  if (total == null) total = viewRes.total_rows
  const data = {
    patches: _.map(viewRes.rows, 'doc'),
    total
  }
  const rangeEnd = offset + limit
  if (rangeEnd < total) data.continue = rangeEnd
  return data
}
