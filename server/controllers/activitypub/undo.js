const _ = require('builders/utils')
const error_ = require('lib/error/error')
const { byExternalId, deleteById } = require('controllers/activitypub/lib/activities')
const { isNonEmptyString } = require('lib/boolean_validations')
const { trackActor } = require('lib/track')

module.exports = async params => {
  let { actor, object } = params

  if (_.isPlainObject(object)) object = object.id

  if (!isNonEmptyString(object)) throw error_.new('invalid activity object', 400, params)
  const activity = await byExternalId(object)
  if (!activity) return { ok: true, warn: 'No activity was undone' }
  if (activity.actor.uri !== actor) {
    throw error_.new('request actor and activity actor do not match', 403, { actor, activity })
  }

  await deleteById(activity._id, activity._rev)
  trackActor(activity.actor.uri, [ 'activitypub', 'undo' ])
  return { ok: true }
}
