import CONFIG from 'config'
import error_ from '#lib/error/error'
import { parseQuery } from '#lib/utils/url'
import { createActivity, getFollowActivitiesByObject } from '#controllers/activitypub/lib/activities'
import { isEntityUri, isUsername } from '#lib/boolean_validations'
import { trackActor } from '#lib/track'
import { signAndPostActivity } from './lib/post_activity.js'
import { validateUser, validateShelf, validateEntity } from './lib/validations.js'
import { makeUrl, getEntityUriFromActorName, context } from './lib/helpers.js'

const host = CONFIG.getPublicOrigin()

export default async params => {
  const { id: externalId, type } = params
  let { actor, object } = params
  if (!object?.startsWith(host)) throw error_.new(`invalid object, string should start with ${host}`, 400, { object })
  const { name: requestedObjectName } = parseQuery(object)

  if (isEntityUri(getEntityUriFromActorName(requestedObjectName))) {
    const { entity } = await validateEntity(requestedObjectName)
    if (!entity) throw error_.notFound({ name: requestedObjectName })
    object = { name: entity.actorName }
    actor = { uri: actor }
  } else if (requestedObjectName.startsWith('shelf-')) {
    await validateShelf(requestedObjectName)
    actor = { uri: actor }
    object = { name: requestedObjectName }
  } else if (isUsername(requestedObjectName)) {
    const { user } = await validateUser(requestedObjectName)
    actor = { uri: actor }
    const { stableUsername } = user
    object = { name: stableUsername }
  } else {
    throw error_.new('invalid object name', 400, { object })
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
    object: followActivity.externalId
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
