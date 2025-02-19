import { dbFactory } from '#db/couchdb/base'
import { hardCodedUsers } from '#db/couchdb/hard_coded_documents'
import { maxKey, minKey } from '#lib/couch'
import { signedFederatedRequestAsUser } from '#lib/federation/signed_federated_request'
import { radio } from '#lib/radio'
import { oneMinute, oneYear } from '#lib/time'
import { info, log, logError, warn } from '#lib/utils/logs'
import { federatedMode } from '#server/config'
import type { Origin } from '#types/common'
import type { NewCouchDoc } from '#types/couchdb'
import type { EntityUri } from '#types/entity'
import type { EventName, InstanceSubscription } from '#types/instances'

const { hook: hookUser } = hardCodedUsers

const db = await dbFactory('instances_subscriptions')

export async function recordSubscription (eventName: EventName, uri: EntityUri, instance: Origin) {
  const existingSubscriptions = await getSubscriptionByEventAndEntityAndOrigin(eventName, uri, instance)
  if (existingSubscriptions.length > 0) {
    warn({ eventName, uri, instance }, 'subscription already exists')
    return
  }
  const subscription: NewCouchDoc<InstanceSubscription> = {
    event: eventName,
    uri,
    instance,
    timestamp: Date.now(),
  }
  await db.post(subscription)
}

export async function getSubscriptionByEventAndEntityAndOrigin (eventName: EventName, uri: EntityUri, instance: Origin) {
  const key = [ eventName, uri, instance ]
  const docs = await db.getDocsByViewKeys<InstanceSubscription>('byEventAndEntityAndOrigin', key)
  return docs
}

export async function emitInstancesEvent (eventName: EventName, fromUri: EntityUri) {
  const subscriptions = await getSubscriptions(eventName, fromUri)
  await emitInstancesEventFromSubscriptions(subscriptions)
}

async function emitInstancesEventFromSubscriptions (subscriptions: InstanceSubscription[]) {
  for (const subscription of subscriptions) {
    try {
      await notifyInstance(subscription)
    } catch (err) {
      logError(err, 'instance notification failed')
    }
  }
}

async function getSubscriptions (eventName: EventName, uri: EntityUri) {
  const subscriptions = await db.getDocsByViewQuery<InstanceSubscription>('byEventAndEntityAndOrigin', {
    startkey: [ eventName, uri, minKey ],
    endkey: [ eventName, uri, maxKey ],
    include_docs: true,
  })
  return subscriptions
}

async function notifyInstance (subscription: InstanceSubscription) {
  try {
    const { event: eventName, uri, instance } = subscription
    await signedFederatedRequestAsUser(hookUser, 'post', `${instance}/api/instances?action=event`, { event: eventName, uri })
    await db.delete(subscription._id, subscription._rev)
  } catch (err) {
    logError(err, 'failed to notify instance')
    await recordNotificationFailure(subscription)
  }
}

if (!federatedMode) {
  radio.on('entity:revert:merge', fromUri => emitInstancesEvent('revert-merge', fromUri))
}

async function recordNotificationFailure (subscription: InstanceSubscription) {
  const now = Date.now()
  subscription.notificationFailed ??= { attempts: 0, firstAttempt: now, lastAttempt: now }
  const firstAttemptWasMoreThanAYearAgo = (now - oneYear) > subscription.notificationFailed.firstAttempt
  if (firstAttemptWasMoreThanAYearAgo) {
    await db.delete(subscription._id, subscription._rev)
    warn(subscription, 'expired instance event subscription: will not retry')
  } else {
    subscription.notificationFailed.attempts++
    subscription.notificationFailed.lastAttempt = now
    await db.put(subscription)
    log(subscription, 'planning instance notification retry')
  }
}

async function retryFailedNotifications () {
  const subscriptions = await getSubscriptionsDueForRetry()
  if (subscriptions.length === 0) return
  info(`retry failed notifications: ${subscriptions.length}`)
  await emitInstancesEventFromSubscriptions(subscriptions)
}

async function getSubscriptionsDueForRetry () {
  const subscriptions = await db.getDocsByViewQuery<InstanceSubscription>('byNextNotificationAttemptTime', {
    startkey: 0,
    endkey: Date.now(),
    include_docs: true,
  })
  return subscriptions
}

if (!federatedMode) {
  setInterval(retryFailedNotifications, 5 * oneMinute)
}
