const _ = require('builders/utils')
const designDocName = 'patches'
const db = require('db/couchdb/base')('patches', designDocName)
const Patch = require('models/patch')
const assert_ = require('lib/utils/assert_types')
const { maxKey } = require('lib/couch')
const { oneDay } = require('lib/time')

module.exports = {
  db,
  byId: db.get,
  byEntityId: entityId => db.viewByKeys('byEntityId', [ entityId ]),
  byEntityIds: entityIds => db.viewByKeys('byEntityId', entityIds),

  byDate: async ({ limit, offset }) => {
    const viewRes = await db.view(designDocName, 'byDate', {
      limit,
      skip: offset,
      descending: true,
      include_docs: true
    })
    return formatPatchesPage({ viewRes, limit, offset })
  },

  byUserId: async ({ userId, limit, offset }) => {
    const [ viewRes, total ] = await Promise.all([
      db.view(designDocName, 'byUserIdAndDate', {
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
      getUserContributionsCount(userId)
    ])

    return formatPatchesPage({ viewRes, total, limit, offset })
  },

  byUserIdAndFilter: async ({ userId, filter, limit, offset }) => {
    const [ viewRes, total ] = await Promise.all([
      db.view(designDocName, 'byUserIdAndFilterAndDate', {
        startkey: [ userId, filter, maxKey ],
        endkey: [ userId, filter ],
        descending: true,
        limit,
        skip: offset,
        include_docs: true,
        reduce: false
      }),
      // Unfortunately, the response doesn't gives the total range length
      // so we need to query it separately
      getUserPropertyContributionsCount(userId, filter)
    ])

    return formatPatchesPage({ viewRes, total, limit, offset })
  },

  byRedirectUri: db.viewByKey.bind(null, 'byRedirectUri'),

  create: async params => {
    const patch = Patch.create(params)
    return db.postAndReturn(patch)
  },

  getWithSnapshots: async entityId => {
    const patches = await byEntityId(entityId)
    Patch.addSnapshots(patches)
    return patches
  },

  getGlobalContributions: async () => {
    let { rows } = await db.view(designDocName, 'byUserId', { group_level: 1 })
    rows = rows.map(formatRow)
    return sortAndFilterContributions(rows)
    // Return only the first hundred results
    .slice(0, 100)
  },

  getContributionsFromLastDay: days => {
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
    .then(contributions => ({
      contributions,
      start: startDay,
      end: today
    }))
  },

  byClaimValue: async (claimValue, offset, limit) => {
    const { rows } = await db.view(designDocName, 'byClaimValueAndDate', {
      startkey: [ claimValue, maxKey ],
      endkey: [ claimValue ],
      descending: true,
      reduce: false,
      skip: offset,
      limit,
    })
    return rows
  },

  getCountByClaimValue: async claimValue => {
    const { rows } = await db.view(designDocName, 'byClaimValueAndDate', {
      startkey: [ claimValue, maxKey ],
      endkey: [ claimValue ],
      group_level: 1,
      descending: true,
    })
    return rows[0]?.value || 0
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
// see server/db/couchdb/hard_coded_documents.js
const noSpecialUser = row => !row.user.startsWith('000000000000000000000000000000')

const getUserContributionsCount = userId => {
  return getRangeLength({
    viewName: 'byUserIdAndDate',
    startkey: [ userId ],
    endkey: [ userId, maxKey ],
  })
}

const getUserPropertyContributionsCount = (userId, filter) => {
  return getRangeLength({
    viewName: 'byUserIdAndFilterAndDate',
    startkey: [ userId, filter ],
    endkey: [ userId, filter, maxKey ],
  })
}

const getRangeLength = async ({ viewName, startkey, endkey }) => {
  const { rows } = await db.view(designDocName, viewName, {
    group_level: startkey.length,
    startkey,
    endkey,
  })
  return rows[0] != null ? rows[0].value : 0
}

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
