import { dbFactory } from '#db/couchdb/base'
import { hardCodedUsers } from '#db/couchdb/hard_coded_documents'
import { maxKey, minKey } from '#lib/couch'
import { signedFederatedRequestAsUser } from '#lib/federation/signed_federated_request'
import { radio } from '#lib/radio'
import { logError, warn } from '#lib/utils/logs'
import { federatedMode } from '#server/config'
import type { Origin } from '#types/common'
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
  const doc = await db.post({
    event: eventName,
    uri,
    instance,
    timestamp: Date.now(),
  })
  return doc
}

export async function getSubscriptionByEventAndEntityAndOrigin (eventName: EventName, uri: EntityUri, instance: Origin) {
  const key = [ eventName, uri, instance ]
  const docs = await db.getDocsByViewKeys<InstanceSubscription>('byEventAndEntityAndOrigin', key)
  return docs
}

export async function emitInstancesEvent (eventName: EventName, fromUri: EntityUri, toUri: EntityUri) {
  const subscriptions = await getSubscriptions(eventName, fromUri)
  // TODO: notify in a job queue
  for (const subscription of subscriptions) {
    await notifyInstance(subscription, toUri)
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

async function notifyInstance (subscription: InstanceSubscription, toUri: EntityUri) {
  try {
    const { event: eventName, uri, instance } = subscription
    await signedFederatedRequestAsUser(hookUser, 'post', `${instance}/api/instances?action=event`, { event: eventName, from: uri, to: toUri })
    await db.delete(subscription._id, subscription._rev)
  } catch (err) {
    // TODO: plan retry
    logError(err, 'failed to notify instance')
  }
}

if (!federatedMode) {
  radio.on('entity:revert:merge', (fromUri, toUri) => emitInstancesEvent('revert-merge', fromUri, toUri))
}
