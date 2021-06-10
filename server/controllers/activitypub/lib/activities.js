const _ = require('builders/utils')
const Activity = require('models/activity')
const db = require('db/couchdb/base')('activities')

const activities_ = module.exports = {
  create: async newActivity => {
    const activity = Activity.create(newActivity)
    return db.postAndReturn(activity)
  },
  byExternalIds: async ids => {
    ids = _.forceArray(ids)
    return db.viewByKeys('byExternalIds', ids)
  },
  byExternalId: async id => {
    const docs = await activities_.byExternalIds(id)
    return docs[0]
  },
  byId: db.get,
  byIds: db.byIds
}
