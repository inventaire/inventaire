const Activity = require('models/activity')
const db = require('db/couchdb/base')('activities')

module.exports = {
  createActivity: async newActivity => {
    const activity = Activity.create(newActivity)
    return db.postAndReturn(activity)
  },
  byId: db.get,
  byIds: db.byIds
}
