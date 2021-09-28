const activities_ = require('./lib/activities')
const formatUserItemsActivities = require('./lib/format_user_items_activities')
const { findOneByUsername } = require('controllers/user/lib/user')
const { isEntityActivityId } = require('./lib/helpers')
const { isCouchUuid } = require('lib/boolean_validations')
const error_ = require('lib/error/error')
const patches_ = require('controllers/entities/lib/patches')
const { getActivitiesFromPatch } = require('./lib/entity_patch_activities')

const sanitization = {
  id: {
    // override couchUuid validation
    generic: 'string'
  }
}

const controller = async ({ id }) => {
  if (isEntityActivityId(id)) {
    return getEntityActivity(id)
  } else {
    return getUserActivity(id)
  }
}

const getEntityActivity = async id => {
  let [ , entityId, versionNumber, activityNumber ] = id.split('-')
  const patchId = `${entityId}:${versionNumber}`
  const patch = await patches_.byId(patchId)
  const activities = await getActivitiesFromPatch(patch)
  activityNumber = parseInt(activityNumber)
  const activity = activities[activityNumber]
  if (!activity) throw error_.notFound({ id })
  return activity
}

const getUserActivity = async id => {
  if (!isCouchUuid(id)) throw error_.new('invalid activity id', 400, { id })
  const activityDoc = await activities_.byId(id)
  const { name } = activityDoc.actor
  const user = await findOneByUsername(name)
  const [ activity ] = await formatUserItemsActivities([ activityDoc ], user)
  return activity
}

module.exports = {
  sanitization,
  controller,
}
