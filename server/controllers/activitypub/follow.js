const error_ = require('lib/error/error')
const qs = require('querystring')
const host = require('config').fullPublicHost()
const { createActivity, getFollowActivitiesByObject } = require('controllers/activitypub/lib/activities')
const { signAndPostActivity } = require('./lib/post_activity')
const { validateUser, validateShelf, validateEntity } = require('./lib/validations')
const { makeUrl, getEntityUriFromActorName } = require('./lib/helpers')
const { isEntityUri, isUsername } = require('lib/boolean_validations')

module.exports = async params => {
  const { id: externalId, type } = params
  let { actor, object } = params
  if (!object?.startsWith(host)) throw error_.new(`invalid object, string should start with ${host}`, 400, { object })
  const { name: requestedObjectName } = qs.parse(object)

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
  return { ok: true }
}

const sendAcceptActivity = async (followActivity, actor, object) => {
  const followedActorUri = makeUrl({ params: { action: 'actor', name: object.name } })
  const activity = {
    '@context': [ 'https://www.w3.org/ns/activitystreams' ],
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
  const followActivitiesByActor = followActivities.filter(activity => activity.actor.uri === actor.uri)
  return followActivitiesByActor[0]
}
