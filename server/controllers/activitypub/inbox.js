const error_ = require('lib/error/error')
const qs = require('querystring')
const user_ = require('controllers/user/lib/user')
const { createActivity, getFollowActivitiesByObject } = require('controllers/activitypub/lib/activities')
const CONFIG = require('config')
const { signAndPostActivity } = require('./lib/post_activity')
const makeUrl = require('./lib/make_url')
const host = CONFIG.fullPublicHost()

const sanitization = {
  id: {
    // override couchUuid validation
    generic: 'string'
  },
  type: {
    allowlist: [ 'Follow' ]
  },
  '@context': {
    allowlist: [ 'https://www.w3.org/ns/activitystreams' ]
  },
  actor: {},
  object: {}
}

const controller = async params => {
  const { id: externalId, type } = params
  let { actor, object } = params
  if (!object.startsWith(host)) throw error_.new(`invalid object, string should start with ${host}`, 400, { object })
  const { name: requestedObjectName } = qs.parse(object)
  object = { name: requestedObjectName }
  const user = await user_.findOneByUsername(requestedObjectName)
  if (!user) throw error_.notFound({ username: requestedObjectName })
  if (!user.fediversable) throw error_.new('user is not on the fediverse', 404, { username: requestedObjectName })
  actor = { uri: actor }
  let followActivity = await getExistingFollowActivity(actor, requestedObjectName)
  if (followActivity) {
    followActivity.externalId = externalId
  } else {
    followActivity = await createActivity({ id: externalId, type, actor, object })
  }
  const followedActorUri = makeUrl({ params: { action: 'actor', name: requestedObjectName } })
  await sendAcceptActivity(followActivity, actor, followedActorUri, user)
  return { ok: true }
}

const sendAcceptActivity = async (followActivity, actor, followedActorUri, user) => {
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
    recipientActorUri: actor.uri,
    activity,
    user,
  })
}

const getExistingFollowActivity = async (actor, name) => {
  const followActivities = await getFollowActivitiesByObject(name)
  const followActivitiesByActor = followActivities.filter(activity => activity.actor.uri === actor.uri)
  return followActivitiesByActor[0]
}

module.exports = {
  sanitization,
  controller,
  track: [ 'activitypub', 'inbox' ]
}
