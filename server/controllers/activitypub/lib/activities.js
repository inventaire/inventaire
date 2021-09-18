const Activity = require('models/activity')
const db = require('db/couchdb/base')('activities')

// activities are stored as documents in order to allow
// grouping items (and entities) under the same activity, this
// way ensures activities consistency which allows pagination based on offsets

module.exports = {
  getFollowActivitiesByObject: async name => {
    return db.viewByKey('followActivitiesByObject', name)
  },
  createActivity: async newActivity => {
    const activity = Activity.create(newActivity)
    return db.postAndReturn(activity)
  },
  byUsername: async username => {
    return db.viewByKey('byUsername', username)
  },
  byId: db.get,
  byIds: db.byIds,
}
