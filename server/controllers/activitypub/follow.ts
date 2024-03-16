import { createActivity, getFollowActivitiesByObject } from '#controllers/activitypub/lib/activities'
import { getEntityActorName } from '#controllers/activitypub/lib/helpers'
import { isEntityUri, isUsername } from '#lib/boolean_validations'
import { newError } from '#lib/error/error'
import { trackActor } from '#lib/track'
import { parseQuery } from '#lib/utils/url'
import config from '#server/config'
import type { LocalActorUrl, ActivityId, UriObj, ActivityType, Context } from '#types/activity'
import type { Url } from '#types/common'
import { makeUrl, getEntityUriFromActorName, context } from './lib/helpers.js'
import { signAndPostActivity } from './lib/post_activity.js'
import { validateUser, validateShelf, validateEntity } from './lib/validations.js'

const host = config.getPublicOrigin()

interface FollowArgs {
  id: ActivityId
  type: ActivityType
  '@context': Context[]
  actor: LocalActorUrl
  object: Url
}

export async function follow (params: FollowArgs) {
  const { id: externalId, type } = params
  const { actor: actorUrl, object: objectUrl } = params
  if (!objectUrl?.startsWith(host)) throw newError(`invalid object, string should start with ${host}`, 400, { objectUrl })
  const { name: requestedObjectName } = parseQuery(objectUrl)

  let object
  const actor: UriObj = { uri: actorUrl }
  if (isEntityUri(getEntityUriFromActorName(requestedObjectName))) {
    const { entity } = await validateEntity(requestedObjectName)
    // Use canonical uri
    const actorName = getEntityActorName(entity.uri)
    object = { name: actorName }
  } else if (requestedObjectName.startsWith('shelf-')) {
    await validateShelf(requestedObjectName)
    object = { name: requestedObjectName }
  } else if (isUsername(requestedObjectName)) {
    const { user } = await validateUser(requestedObjectName)
    const { stableUsername } = user
    object = { name: stableUsername }
  } else {
    throw newError('invalid object name', 400, { object })
  }

  let followActivity = await getExistingFollowActivity(actor, object.name)
  if (followActivity) {
    followActivity.externalId = externalId
  } else {
    followActivity = await createActivity({ id: externalId, type, actor, object })
  }
  await sendAcceptActivity(followActivity, actor, object)
  trackActor(actor.uri, [ 'activitypub', 'follow' ])
  return { ok: true }
}

const sendAcceptActivity = async (followActivity, actor, object) => {
  const followedActorUri = makeUrl({ params: { action: 'actor', name: object.name } })
  const activity = {
    '@context': context,
    type: 'Accept',
    actor: followedActorUri,
    object: followActivity.externalId,
  }
  // "the server SHOULD generate either an Accept or Reject activity
  // with the Follow as the object and deliver it to the actor of the Follow."
  // See https://www.w3.org/TR/activitypub/#follow-activity-outbox
  await signAndPostActivity({
    actorName: object.name,
    recipientActorUri: actor.uri,
    activity,
  })
}

const getExistingFollowActivity = async (actor, name) => {
  const followActivities = await getFollowActivitiesByObject(name)
  return followActivities.find(activity => activity.actor.uri === actor.uri)
}
