import CONFIG from 'config'
import _ from '#builders/utils'
import { getShelfById } from '#controllers/shelves/lib/shelves'
import { getUserById } from '#controllers/user/lib/user'
import { radio } from '#lib/radio'
import { LogError } from '#lib/utils/logs'
import { byActorName, createActivity } from './activities.js'
import { deliverEntityActivitiesFromPatch } from './entity_patch_activities.js'
import formatShelfItemsActivities from './format_shelf_items_activities.js'
import formatUserItemsActivities from './format_user_items_activities.js'
import { postActivityToActorFollowersInboxes } from './post_activity.js'

const { activitiesDebounceTime } = CONFIG
const debouncedActivities = {}

export function initRadioHooks () {
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
  .catch(LogError('createDebouncedActivity error'))
}

const _createDebouncedActivity = async ({ userId, shelfId }) => {
  let name, user
  if (userId) {
    delete debouncedActivities[userId]
    user = await getUserById(userId)
    if (!user.fediversable) return
    name = user.stableUsername
  } else if (shelfId) {
    delete debouncedActivities[shelfId]
    // TODO: if this throws an error because the shelf was deleted
    // create a type=Delete activity instead, to notify the followers
    const shelf = await getShelfById(shelfId)
    if (!shelf.visibility.includes('public')) return
    const owner = await getUserById(shelf.owner)
    if (!owner.fediversable) return
    // todo: use group slugify to create shelf name
    // shelf = await getShelfById(shelfId)
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
