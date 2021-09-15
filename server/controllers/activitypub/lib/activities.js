const _ = require('builders/utils')
const Activity = require('models/activity')
const db = require('db/couchdb/base')('activities')
const { expired } = require('lib/time')
const { activitiesDebounceTime } = require('config')
const radio = require('lib/radio')
const items_ = require('controllers/items/lib/items')
const user_ = require('controllers/user/lib/user')
const formatActivities = require('./format_activities')
const requests_ = require('lib/requests')
const { signRequest } = require('controllers/activitypub/lib/security')
const error_ = require('lib/error/error')

// activities are stored as documents in order to allow
// grouping items (and entities) under the same activity, this
// way ensures activities consistency which allows pagination based on offsets

const activities_ = module.exports = {
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
  postActivityToInbox: ({ headers, activity, privateKey }) => async followActivity => {
    const uri = followActivity.actor.uri
    if (!uri) return
    let actorRes
    try {
      actorRes = await requests_.get(uri, { headers })
    } catch (err) {
      throw error_.new('Cannot fetch remote actor information, cannot post activity', 400, { uri, activity, err })
    }
    const inboxUri = actorRes.inbox
    if (!inboxUri) return _.log('No inbox found, cannot post activity', uri)

    let postHeaders = signRequest({ method: 'post', keyUrl: inboxUri, privateKey })
    postHeaders = _.extend(postHeaders, headers)
    postHeaders['content-type'] = 'application/activity+json'
    try {
      return requests_.post(inboxUri, { headers: postHeaders, body: activity })
    } catch (err) {
      throw error_.new('Posting activity to inbox failed', 400, { inboxUri, activity, err })
    }
  }

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
  const user = await user_.byId(userId)
  const { username } = user
  const activities = await activities_.byUsername(username)
  const activitiesItemsIds = _.flatMap(activities, _.property('object.itemsIds'))
  const newItemsIds = _.difference(publicItemsIds, activitiesItemsIds)
  return createActivity(username, newItemsIds)
  .then(postActivityToInboxes(user))
  .catch(_.Error('create debounced activity err'))
}

radio.on('user:inventory:update', userId => {
  if (!debouncedActivities[userId]) {
    debouncedActivities[userId] = _.debounce(createDebouncedActivity(userId), activitiesDebounceTime)
  }
  return debouncedActivities[userId]()
})

const postActivityToInboxes = user => async activity => {
  const followActivities = await activities_.getFollowActivitiesByObject(user.username)
  // arbitrary timeout
  const headers = { timeout: 30 * 1000 }
  const formattedActivities = await formatActivities([ activity ], user)
  const formattedActivity = formattedActivities[0]
  return followActivities.forEach(activities_.postActivityToInbox({ headers, activity: formattedActivity, privateKey: user.privateKey }))
}
