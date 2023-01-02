import CONFIG from 'config'
import _ from '#builders/utils'
import radio from '#lib/radio'
import user_ from '#controllers/user/lib/user'
import shelves_ from '#controllers/shelves/lib/shelves'
import { postActivityToActorFollowersInboxes } from './post_activity.js'
import { byActorName, createActivity } from './activities.js'
import formatUserItemsActivities from './format_user_items_activities.js'
import formatShelfItemsActivities from './format_shelf_items_activities.js'
import { deliverEntityActivitiesFromPatch } from './entity_patch_activities.js'

const { activitiesDebounceTime } = CONFIG
const debouncedActivities = {}

export default function () {
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
  _createDebouncedActivity({ userId, shelfId })
  .catch(_.Error('createDebouncedActivity error'))
}

const _createDebouncedActivity = async ({ userId, shelfId }) => {
  let name, user
  if (userId) {
    delete debouncedActivities[userId]
    user = await user_.byId(userId)
    if (!user.fediversable) return
    name = user.stableUsername
  } else if (shelfId) {
    delete debouncedActivities[shelfId]
    // TODO: if this throws an error because the shelf was deleted
    // create a type=Delete activity instead, to notify the followers
    const shelf = await shelves_.byId(shelfId)
    if (!shelf.visibility.includes('public')) return
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
