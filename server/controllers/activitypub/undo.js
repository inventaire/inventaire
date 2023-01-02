import _ from '#builders/utils'
import { byExternalId, deleteActivityById } from '#controllers/activitypub/lib/activities'
import { isNonEmptyString } from '#lib/boolean_validations'
import { error_ } from '#lib/error/error'
import { trackActor } from '#lib/track'

export default async params => {
  let { actor, object } = params

  if (_.isPlainObject(object)) object = object.id

  if (!isNonEmptyString(object)) throw error_.new('invalid activity object', 400, params)
  const activity = await byExternalId(object)
  if (!activity) return { ok: true, warn: 'No activity was undone' }
  if (activity.actor.uri !== actor) {
    throw error_.new('request actor and activity actor do not match', 403, { actor, activity })
  }

  await deleteActivityById(activity._id, activity._rev)
  trackActor(activity.actor.uri, [ 'activitypub', 'undo' ])
  return { ok: true }
}
