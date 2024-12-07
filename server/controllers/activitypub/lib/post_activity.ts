import { signRequest } from '#controllers/activitypub/lib/security'
import { isUrl } from '#lib/boolean_validations'
import { newError } from '#lib/error/error'
import { requests_ } from '#lib/requests'
import { warn, logError } from '#lib/utils/logs'
import config from '#server/config'
import type { ActorName, PostActivity } from '#types/activity'
import type { AbsoluteUrl } from '#types/common'
import { getFollowActivitiesByObject } from './activities.js'
import { makeUrl } from './helpers.js'
import { getSharedKeyPair } from './shared_key_pair.js'
// Arbitrary timeout
const timeout = 30 * 1000
const sanitize = config.activitypub.sanitizeUrls

export async function signAndPostActivity ({ actorName, recipientActorUri, activity }: { actorName: ActorName, recipientActorUri: AbsoluteUrl, activity: PostActivity }) {
  let actorRes
  try {
    actorRes = await requests_.get(recipientActorUri, { timeout, sanitize })
  } catch (err) {
    logError(err, 'signAndPostActivity private error')
    throw newError('Cannot fetch remote actor information, cannot post activity', 400, { recipientActorUri, activity })
  }
  const inboxUri = actorRes.inbox
  if (!inboxUri) {
    return warn({ actorName, recipientActorUri, activity }, 'No inbox found, cannot post activity')
  }

  if (!isUrl(inboxUri)) {
    return warn({ actorName, recipientActorUri, activity, inboxUri }, 'Invalid inbox URL, cannot post activity')
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
    body,
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
    logError(err, 'Posting activity to inbox failed')
  }
}

type BodyTo = (AbsoluteUrl | 'Public')[]
export async function postActivity ({ actorName, inboxUri, bodyTo, activity }: { actorName: ActorName, inboxUri: AbsoluteUrl, bodyTo: BodyTo, activity: PostActivity }) {
  const { privateKey, publicKeyHash } = await getSharedKeyPair()

  const keyActorUrl = makeUrl({ params: { action: 'actor', name: actorName } })

  const body: PostActivity = Object.assign({}, activity)
  body.to = bodyTo
  const postHeaders = signRequest({
    url: inboxUri,
    method: 'post',
    keyId: `${keyActorUrl}#${publicKeyHash}`,
    privateKey,
    body,
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
    logError(err, 'Posting activity to inbox failed')
  }
}

// TODO: use sharedInbox
export async function postActivityToActorFollowersInboxes ({ activity, actorName }: { activity: PostActivity, actorName: ActorName }) {
  const followActivities = await getFollowActivitiesByObject(actorName)
  const inboxUrisByBodyTos: Record<AbsoluteUrl, BodyTo> = {}
  await Promise.all(followActivities.map(activity => buildAudience(activity, inboxUrisByBodyTos)))
  const inboxUris = Object.keys(inboxUrisByBodyTos) as AbsoluteUrl[]
  return Promise.all(inboxUris.map(inboxUri => {
    const bodyTo: BodyTo = inboxUrisByBodyTos[inboxUri]
    return postActivity({ actorName, inboxUri, bodyTo, activity })
  }))
}

async function fetchInboxUri ({ actorUri, activity }: { actorUri: AbsoluteUrl, activity: PostActivity }) {
  let actorRes
  try {
    actorRes = await requests_.get(actorUri, { timeout, sanitize })
  } catch (err) {
    logError(err, 'signAndPostActivity private error')
    throw newError('Cannot fetch remote actor information, cannot post activity', 400, { actorUri, activity })
  }

  const { inbox: inboxUri, sharedInbox }: { inbox: AbsoluteUrl, sharedInbox: AbsoluteUrl } = actorRes

  const inbox: AbsoluteUrl = sharedInbox || inboxUri

  if (!inbox) {
    return warn({ actorUri, activity }, 'No inbox found, cannot post activity')
  }
  if (!isUrl(inbox)) {
    return warn({ actorUri, activity, inbox }, 'Invalid inbox URL, cannot post activity')
  }

  return inbox
}

async function buildAudience (activity, inboxUrisByBodyTos) {
  const actorUri: AbsoluteUrl = activity.actor.uri
  const inboxUri = await fetchInboxUri({ actorUri, activity }) as AbsoluteUrl
  if (inboxUrisByBodyTos[inboxUri]) {
    inboxUrisByBodyTos[inboxUri] = inboxUrisByBodyTos[inboxUri].unshift(actorUri)
  } else {
    inboxUrisByBodyTos[inboxUri] = [ actorUri, 'Public' ]
  }
}
