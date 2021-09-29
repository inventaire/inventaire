const _ = require('builders/utils')
const requests_ = require('lib/requests')
const { signRequest } = require('controllers/activitypub/lib/security')
const error_ = require('lib/error/error')
const { getFollowActivitiesByObject } = require('./activities')
const assert_ = require('lib/utils/assert_types')
const { publicHost } = require('config')
const { getSharedKeyPair } = require('./shared_key_pair')
// Arbitrary timeout
const timeout = 30 * 1000

const signAndPostActivity = async ({ actorName, recipientActorUri, activity }) => {
  assert_.string(actorName)
  assert_.string(recipientActorUri)
  assert_.object(activity)
  let actorRes
  try {
    actorRes = await requests_.get(recipientActorUri, { timeout })
  } catch (err) {
    throw error_.new('Cannot fetch remote actor information, cannot post activity', 400, { recipientActorUri, activity, err })
  }
  const inboxUri = actorRes.inbox
  if (!inboxUri) {
    return _.warn({ recipientActorUri }, 'No inbox found, cannot post activity')
  }

  const keyId = `acct:${actorName}@${publicHost}`

  const { privateKey } = await getSharedKeyPair()

  const body = Object.assign({}, activity)

  body.to = [ recipientActorUri, 'Public' ]
  const postHeaders = signRequest({ url: inboxUri, method: 'post', keyId, privateKey, body })
  postHeaders['content-type'] = 'application/activity+json'
  try {
    return requests_.post(inboxUri, { headers: postHeaders, body, timeout, parseJson: false })
  } catch (err) {
    throw error_.new('Posting activity to inbox failed', 400, { inboxUri, activity, err })
  }
}

// TODO: use sharedInbox
const postActivityToActorFollowersInboxes = async ({ activity, actorName }) => {
  const followActivities = await getFollowActivitiesByObject(actorName)
  if (followActivities.length === 0) return
  const followersActorsUris = _.uniq(_.map(followActivities, 'actor.uri'))
  return Promise.all(followersActorsUris.map(uri => {
    return signAndPostActivity({ actorName, recipientActorUri: uri, activity })
  }))
}

module.exports = { signAndPostActivity, postActivityToActorFollowersInboxes }
