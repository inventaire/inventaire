const _ = require('builders/utils')
const Activity = require('models/activity')
const db = require('db/couchdb/base')('activities')
const { expired, fiveMinutes } = require('lib/time')
const cache_ = require('lib/cache')
const { tap } = require('lib/promises')

// activities are stored as documents in order to allow
// grouping items (and entities) under the same activity, this
// way ensures activities consistency which allows pagination based on offsets

const activities_ = module.exports = {
  createActivity: async params => {
    const { actor } = params
    const { username } = actor
    // get last updated activity date, if recent enough then
    // do not create a new activity but update the last updated one
    const key = `last-updated-activity:${username}`
    const { lastUpdate, activityId } = await cache_.get({ key, dry: true }) || {}
    let updateOrCreatePromise
    if (isRecent(lastUpdate)) {
      updateOrCreatePromise = updateLastActivity(params, activityId)
    } else {
      updateOrCreatePromise = createActivity(params)
    }

    return updateOrCreatePromise
    .then(tap(activity => {
      const value = {
        lastUpdate: activity.updated,
        activityId: activity._id
      }
      cache_.put(key, value)
    }))
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

const isRecent = date => date && !expired(date, fiveMinutes)

const createActivity = params => {
  const newActivity = formatActivity(params)
  const activity = Activity.create(newActivity)
  return db.postAndReturn(activity)
}

const updateLastActivity = async (params, activityId) => {
  const { itemsIds: newItemsIds } = params
  let activity = await activities_.byId(activityId)
  const { itemsIds: currentItemsIds } = activity.object
  activity.object.itemsIds = _.extend(currentItemsIds, newItemsIds)
  activity = Activity.update(activity)
  return db.putAndReturn(activity)
}

const formatActivity = params => {
  const { username, type, id, itemsIds } = params
  let { actor } = params
  if (username && !actor) actor = { username }
  const activity = { type, actor, object: { itemsIds } }
  if (id) _.extend(activity, { externalId: id })
  return activity
}
