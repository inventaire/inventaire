const Activity = require('models/activity')
const db = require('db/couchdb/base')('activities')
const assert_ = require('lib/utils/assert_types')
const { firstDoc } = require('lib/couch')

// activities are stored as documents in order to allow
// grouping items (and entities) under the same activity, this
// way ensures activities consistency which allows pagination based on offsets

module.exports = {
  byId: db.get,
  byIds: db.byIds,
  deleteById: db.delete,
  getFollowActivitiesByObject: async name => {
    return db.viewByKey('followActivitiesByObject', name)
  },
  createActivity: async newActivity => {
    const activity = Activity.create(newActivity)
    return db.postAndReturn(activity)
  },
  byUsername: async ({ username, limit = 10, offset = 0 }) => {
    assert_.string(username)
    return db.viewCustom('byUsernameAndDate', {
      limit,
      skip: offset,
      startkey: [ username, Date.now() ],
      endkey: [ username, 0 ],
      descending: true,
      include_docs: true,
      reduce: false
    })
  },
  getActivitiesCountByUsername: async username => {
    assert_.string(username)
    const res = await db.view('activities', 'byUsernameAndDate', {
      startkey: [ username, 0 ],
      endkey: [ username, Date.now() ],
      group_level: 1
    })
    return res.rows[0]?.value || 0
  },
  byExternalId: externalId => {
    return db.viewByKey('byExternalId', externalId)
    .then(firstDoc)
  },
}
