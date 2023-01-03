import { getActivityById } from '#controllers/activitypub/lib/activities'
import { getPatchById } from '#controllers/entities/lib/patches/patches'
import { isCouchUuid } from '#lib/boolean_validations'
import { error_ } from '#lib/error/error'
import { getActivitiesFromPatch } from './lib/entity_patch_activities.js'
import formatShelfItemsActivities from './lib/format_shelf_items_activities.js'
import formatUserItemsActivities from './lib/format_user_items_activities.js'
import { isEntityActivityId } from './lib/helpers.js'
import { validateShelf, validateUser } from './lib/validations.js'

const sanitization = {
  id: {
    // override couchUuid validation
    generic: 'string',
  },
}

const controller = async ({ id }) => {
  if (isEntityActivityId(id)) {
    return getEntityActivity(id)
  } else {
    return getActivity(id)
  }
}

const getEntityActivity = async id => {
  let [ , entityId, versionNumber, activityNumber ] = id.split('-')
  const patchId = `${entityId}:${versionNumber}`
  const patch = await getPatchById(patchId)
  const activities = await getActivitiesFromPatch(patch)
  activityNumber = parseInt(activityNumber)
  const activity = activities[activityNumber]
  if (!activity) throw error_.notFound({ id })
  return activity
}

const getActivity = async id => {
  if (!isCouchUuid(id)) throw error_.new('invalid activity id', 400, { id })
  const activityDoc = await getActivityById(id)
  const { name } = activityDoc.actor
  if (name.startsWith('shelf-')) {
    return getShelfActivity(activityDoc, name)
  } else {
    return getUserActivity(activityDoc, name)
  }
}

const getUserActivity = async (activityDoc, name) => {
  const { user } = await validateUser(name)
  const [ activity ] = await formatUserItemsActivities([ activityDoc ], user)
  return activity
}

const getShelfActivity = async (activityDoc, name) => {
  const { shelf } = await validateShelf(name)
  const [ activity ] = await formatShelfItemsActivities([ activityDoc ], shelf._id, name)
  return activity
}

export default {
  sanitization,
  controller,
}
