const Activity = require('models/activity')
const db = require('db/couchdb/base')('activities')
const { expired } = require('lib/time')
const { activitiesDebounceTime } = require('config')

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
    .then(docs => docs.filter(oldEnough))
  },
  byId: db.get,
  byIds: db.byIds,
}

const oldEnough = doc => !isRecent(doc.updated)

const isRecent = date => date && !expired(date, activitiesDebounceTime)
