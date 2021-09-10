const _ = require('builders/utils')
const Activity = require('models/activity')
const db = require('db/couchdb/base')('activities')
const { expired } = require('lib/time')
const { activitiesDebounceTime } = require('config')
const radio = require('lib/radio')
const items_ = require('controllers/items/lib/items')
const user_ = require('controllers/user/lib/user')

// activities are stored as documents in order to allow
// grouping items (and entities) under the same activity, this
// way ensures activities consistency which allows pagination based on offsets

const activities_ = module.exports = {
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
    .then(docs => docs.filter(oldEnough))
  },
  byId: db.get,
  byIds: db.byIds
}

const oldEnough = doc => !isRecent(doc.updated)

const isRecent = date => date && !expired(date, activitiesDebounceTime)

const createActivity = (username, itemsIds) => {
  const params = {
    actor: {
      username,
    },
    itemsIds,
    type: 'Create'
  }
  const newActivity = formatActivity(params)
  const activity = Activity.create(newActivity)
  return db.postAndReturn(activity)
}

const formatActivity = params => {
  const { username, type, id, itemsIds } = params
  let { actor } = params
  if (username && !actor) actor = { username }
  const activity = { type, actor, object: { itemsIds } }
  if (id) _.extend(activity, { externalId: id })
  return activity
}

const debouncedActivities = {}

const createDebouncedActivity = userId => async () => {
  delete debouncedActivities[userId]
  const publicItems = await items_.recentPublicByOwner(userId)
  const publicItemsIds = publicItems.map(_.property('_id'))
  const { username } = await user_.byId(userId)
  const activitiesItemsIds = []
  const activities = await activities_.byUsername(username)
  activities.forEach(activity => {
    if (!_.isNonEmptyArray(activity.itemsIds)) return
    activitiesItemsIds.push(...activity.itemsIds)
  })
  const newItemsIds = _.difference(publicItemsIds, activitiesItemsIds)
  return createActivity(username, newItemsIds)
  .catch(_.Error('create debounced activity err'))
}

radio.on('user:inventory:update', userId => {
  if (!debouncedActivities[userId]) {
    debouncedActivities[userId] = _.debounce(createDebouncedActivity(userId), activitiesDebounceTime)
  }
  return debouncedActivities[userId]()
})
