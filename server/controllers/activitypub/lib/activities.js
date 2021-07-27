const _ = require('builders/utils')
const Activity = require('models/activity')
const db = require('db/couchdb/base')('activities')

// activities are stored as documents in order to allow
// grouping items (and entities) under the same activity, this
// way ensures activities consistency which allows pagination based on offsets

const activities_ = module.exports = {
  createActivity: async params => {
    const newActivity = formatActivity(params)
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
  byUsername: async username => {
    return db.viewByKey('byUsername', username)
  },
  byId: db.get,
  byIds: db.byIds
}

const formatActivity = params => {
  const { username, type, id, itemsIds } = params
  let { actor } = params
  if (username && !actor) actor = { username }
  const activity = { type, actor, object: { itemsIds } }
  if (id) _.extend(activity, { externalId: id })
  return activity
}
