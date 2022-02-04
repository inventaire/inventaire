const _ = require('builders/utils')
const { activitiesDebounceTime } = require('config').activitypub
const radio = require('lib/radio')
const user_ = require('controllers/user/lib/user')
const shelves_ = require('controllers/shelves/lib/shelves')
const { postActivityToActorFollowersInboxes } = require('./post_activity')
const { byActorName, createActivity } = require('./activities')
const formatUserItemsActivities = require('./format_user_items_activities')
const formatShelfItemsActivities = require('./format_shelf_items_activities')
const { deliverEntityActivitiesFromPatch } = require('./entity_patch_activities')
const debouncedActivities = {}

module.exports = () => {
  radio.on('user:inventory:update', userId => {
    if (!debouncedActivities[userId]) {
      debouncedActivities[userId] = _.debounce(createDebouncedActivity({ userId }), activitiesDebounceTime)
    }
    return debouncedActivities[userId]()
  })
  radio.on('shelves:update', shelvesIds => {
    return Promise.all(shelvesIds.map(debounceActivities))
  })
  radio.on('patch:created', deliverEntityActivitiesFromPatch)
}

const createDebouncedActivity = ({ userId, shelfId }) => async () => {
  let name, user
  if (userId) {
    delete debouncedActivities[userId]
    user = await user_.byId(userId)
    if (!user.fediversable) return
    name = user.stableUsername
  } else if (shelfId) {
    delete debouncedActivities[shelfId]
    const shelf = await shelves_.byId(shelfId)
    if (shelf.listing !== 'public') return
    const owner = await user_.byId(shelf.owner)
    if (!owner.fediversable) return
    // todo: use group slugify to create shelf name
    // shelf = await shelves_.byId(shelfId)
    name = `shelf-${shelfId}`
  }
  const [ lastActivity ] = await byActorName({ name, limit: 1 })
  const since = lastActivity?.updated || 0

  const activityDoc = await createActivity({
    type: 'Create',
    actor: { name },
    object: { items: { since, until: Date.now() } },
  })

  let activity
  if (userId) {
    [ activity ] = await formatUserItemsActivities([ activityDoc ], user)
  } else if (shelfId) {
    [ activity ] = await formatShelfItemsActivities([ activityDoc ], shelfId, name)
  }
  if (!activity) return

  return postActivityToActorFollowersInboxes({ activity, actorName: name })
}

const debounceActivities = async shelfId => {
  if (!debouncedActivities[shelfId]) {
    debouncedActivities[shelfId] = _.debounce(createDebouncedActivity({ shelfId }), activitiesDebounceTime)
  }
  return debouncedActivities[shelfId]()
}
