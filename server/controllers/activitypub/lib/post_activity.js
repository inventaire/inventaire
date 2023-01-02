import CONFIG from 'config'
import _ from '#builders/utils'
import requests_ from '#lib/requests'
import { signRequest } from '#controllers/activitypub/lib/security'
import error_ from '#lib/error/error'
import assert_ from '#lib/utils/assert_types'
import { isUrl } from '#lib/boolean_validations'
import { getFollowActivitiesByObject } from './activities.js'
import { getSharedKeyPair } from './shared_key_pair.js'
import { makeUrl } from './helpers.js'
// Arbitrary timeout
const timeout = 30 * 1000
const sanitize = CONFIG.activitypub.sanitizeUrls

const signAndPostActivity = async ({ actorName, recipientActorUri, activity }) => {
  assert_.string(actorName)
  assert_.string(recipientActorUri)
  assert_.object(activity)
  let actorRes
  try {
    actorRes = await requests_.get(recipientActorUri, { timeout, sanitize })
  } catch (err) {
    _.error(err, 'signAndPostActivity private error')
    throw error_.new('Cannot fetch remote actor information, cannot post activity', 400, { recipientActorUri, activity })
  }
  const inboxUri = actorRes.inbox
  if (!inboxUri) {
    return _.warn({ actorName, recipientActorUri, activity }, 'No inbox found, cannot post activity')
  }

  if (!isUrl(inboxUri)) {
    return _.warn({ actorName, recipientActorUri, activity, inboxUri }, 'Invalid inbox URL, cannot post activity')
  }

  const { privateKey, publicKeyHash } = await getSharedKeyPair()

  const keyActorUrl = makeUrl({ params: { action: 'actor', name: actorName } })

  const body = Object.assign({}, activity)

  body.to = [ recipientActorUri, 'Public' ]
  const postHeaders = signRequest({
    url: inboxUri,
    method: 'post',
    keyId: `${keyActorUrl}#${publicKeyHash}`,
    privateKey,
    body
  })
  postHeaders['content-type'] = 'application/activity+json'
  try {
    await requests_.post(inboxUri, {
      headers: postHeaders,
      body,
      timeout,
      parseJson: false,
      retryOnceOnError: true,
    })
  } catch (err) {
    err.context = err.context || {}
    Object.assign(err.context, { inboxUri, activity })
    _.error(err, 'Posting activity to inbox failed')
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

export default { signAndPostActivity, postActivityToActorFollowersInboxes }
