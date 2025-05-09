import { makeActorKeyUrl } from '#controllers/activitypub/lib/get_actor'
import { signRequest } from '#controllers/activitypub/lib/security'
import { initJobQueue } from '#db/level/jobs'
import { isUrl } from '#lib/boolean_validations'
import { newError } from '#lib/error/error'
import { whateverWorks } from '#lib/promises'
import { requests_, sanitizeUrl } from '#lib/requests'
import { LogError, warn, logError, info } from '#lib/utils/logs'
import config from '#server/config'
import type { ActorName, PostActivity, BodyTo } from '#types/activity'
import type { AbsoluteUrl } from '#types/common'
import { getFollowActivitiesByObject } from './activities.js'
import { getSharedKeyPair } from './shared_key_pair.js'

// Arbitrary timeout
const timeout = 30 * 1000
const { sanitizeUrls } = config.activitypub

export async function postActivity ({ actorName, inboxUri, bodyTo, activity }: { actorName: ActorName, inboxUri: AbsoluteUrl, bodyTo: BodyTo, activity: PostActivity }) {
  const body: PostActivity = Object.assign({}, activity)
  body.to = bodyTo
  info(`activity: ${activity.id} queuing`)
  await postActivityQueue.push({ inboxUri, body, actorName })
  .catch(LogError('addPostActivityToQueue err'))
}

export async function postActivityToActorFollowersInboxes ({ activity, actorName }: { activity: PostActivity, actorName: ActorName }) {
  const followActivities = await getFollowActivitiesByObject({ name: actorName })
  const bodyToByInboxUris: Record<AbsoluteUrl, BodyTo> = {}
  await whateverWorks(followActivities.map(activity => buildAudience(activity, bodyToByInboxUris)))
  const inboxUris = Object.keys(bodyToByInboxUris) as AbsoluteUrl[]
  return Promise.all(inboxUris.map(inboxUri => {
    const bodyTo: BodyTo = bodyToByInboxUris[inboxUri]
    return postActivity({ actorName, inboxUri, bodyTo, activity })
  }))
}

export async function fetchInboxUri ({ actorUri, activity }: { actorUri: AbsoluteUrl, activity: PostActivity }) {
  let actorRes
  try {
    // Improvements to ease other instances: Either cache requests or
    // optimize by not requesting the same shared inboxes over and over,
    // aka Only do one request to all actorUris that have the same domain and a sharedInbox,
    // assuming server sharedInbox is the same for all instance actors
    if (sanitizeUrls) actorUri = await sanitizeUrl(actorUri)
    actorRes = await requests_.get(actorUri, { timeout })
  } catch (err) {
    logError(err, 'signAndPostActivity private error')
    throw newError('Cannot fetch remote actor information, cannot post activity', 400, { actorUri, activity })
  }

  const { inbox: inboxUri, sharedInbox }: { inbox: AbsoluteUrl, sharedInbox: AbsoluteUrl } = actorRes

  const inbox: AbsoluteUrl = sharedInbox || inboxUri

  if (!inbox) {
    warn({ actorUri, activity }, 'No inbox found, cannot post activity')
  } else if (!isUrl(inbox)) {
    warn({ actorUri, activity, inbox }, 'Invalid inbox URL, cannot post activity')
  } else {
    return inbox
  }
}

async function buildAudience (activity, bodyToByInboxUris) {
  const actorUri: AbsoluteUrl = activity.actor.uri
  const inboxUri = await fetchInboxUri({ actorUri, activity }) as AbsoluteUrl
  if (inboxUri) {
    if (bodyToByInboxUris[inboxUri]) {
      bodyToByInboxUris[inboxUri] = bodyToByInboxUris[inboxUri].unshift(actorUri)
    } else {
      bodyToByInboxUris[inboxUri] = [ actorUri, 'Public' ]
    }
  }
}

async function postActivityWorker (jobId, requestData: { actorName: ActorName, inboxUri: AbsoluteUrl, body: PostActivity }) {
  const { actorName, inboxUri, body } = requestData
  info(`activity: ${body.id} processing`)
  const { privateKey, publicKeyHash } = await getSharedKeyPair()

  const postHeaders = signRequest({
    url: inboxUri,
    method: 'post',
    keyId: makeActorKeyUrl(actorName, publicKeyHash),
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
    })
    info(`activity: ${body.id} sent`)
  } catch (err) {
    err.context ??= {}
    Object.assign(err.context, { inboxUri, body })
    logError(err, 'Posting activity to inbox failed')
  }
}

const postActivityQueue = initJobQueue('post:activity', postActivityWorker, 1)
