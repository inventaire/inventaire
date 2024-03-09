import { isPlainObject } from 'lodash-es'
import { getActivityByExternalId, deleteActivityById } from '#controllers/activitypub/lib/activities'
import { isNonEmptyString } from '#lib/boolean_validations'
import { catchNotFound, newError } from '#lib/error/error'
import { trackActor } from '#lib/track'

export default async params => {
  let { actor, object } = params

  if (isPlainObject(object)) object = object.id

  if (!isNonEmptyString(object)) throw newError('invalid activity object', 400, params)
  const activity = await getActivityByExternalId(object)
  .catch(catchNotFound)
  if (!activity) return { ok: true, warn: 'No activity was undone' }
  if (activity.actor.uri !== actor) {
    throw newError('request actor and activity actor do not match', 403, { actor, activity })
  }

  await deleteActivityById(activity._id, activity._rev)
  trackActor(activity.actor.uri, [ 'activitypub', 'undo' ])
  return { ok: true }
}
