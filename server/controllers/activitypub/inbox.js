const error_ = require('lib/error/error')
const qs = require('querystring')
const user_ = require('controllers/user/lib/user')
const { createActivity, getFollowActivitiesByObject } = require('controllers/activitypub/lib/activities')
const CONFIG = require('config')
const { postActivityToInbox } = require('./lib/post_activity_to_inboxes')
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
  const { id, type } = params
  let { actor, object } = params
  if (!object.startsWith(host)) throw error_.new(`invalid object, string should start with ${host}`, 400, { object })
  const { name: requestedObjectName } = qs.parse(object)
  object = { name: requestedObjectName }
  const user = await user_.findOneByUsername(requestedObjectName)
  if (!user) throw error_.notFound({ username: requestedObjectName })
  if (!user.fediversable) throw error_.new('user is not on the fediverse', 404, { username: requestedObjectName })
  actor = { uri: actor }
  // todo: insert early return once Unfollow is implemented
  if (await isAlreadyFollowing(actor, requestedObjectName)) { }
  const followActivity = await createActivity({ id, type, actor, object })
  const followedActorUri = makeUrl({ params: { action: 'actor', name: requestedObjectName } })
  return sendAcceptActivity(followActivity, actor, followedActorUri, user)
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
  await postActivityToInbox({
    recipientActorUri: actor.uri,
    activity,
    user,
  })
  return { ok: true }
}

const isAlreadyFollowing = async (actor, name) => {
  const followActivities = await getFollowActivitiesByObject(name)
  const followActivitiesByActor = followActivities.filter(activity => activity.actor.uri === actor.uri)
  return followActivitiesByActor.length >= 1
}

module.exports = {
  sanitization,
  controller,
  track: [ 'activitypub', 'inbox' ]
}
