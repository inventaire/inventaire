const error_ = require('lib/error/error')
const qs = require('querystring')
const user_ = require('controllers/user/lib/user')
const host = require('config').fullPublicHost()
const { createActivity, getFollowActivitiesByObject } = require('controllers/activitypub/lib/activities')
const { signAndPostActivity } = require('./lib/post_activity')
const makeUrl = require('./lib/make_url')
const { isEntityUri, isUsername } = require('lib/boolean_validations')
const getEntityByUri = require('controllers/entities/lib/get_entity_by_uri')

module.exports = async params => {
  const { id: externalId, type } = params
  let { actor, object } = params
  if (!object.startsWith(host)) throw error_.new(`invalid object, string should start with ${host}`, 400, { object })
  const { name: requestedObjectName } = qs.parse(object)

  if (isEntityUri(requestedObjectName)) {
    const entity = await getEntityByUri({ uri: requestedObjectName })
    if (!entity) throw error_.notFound({ uri: requestedObjectName })
    object = { name: entity.uri }
    actor = { uri: actor }
  } else if (isUsername(requestedObjectName)) {
    const user = await user_.findOneByUsername(requestedObjectName)
    if (!user) throw error_.notFound({ username: requestedObjectName })
    if (!user.fediversable) throw error_.new('user is not on the fediverse', 404, { username: requestedObjectName })
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
