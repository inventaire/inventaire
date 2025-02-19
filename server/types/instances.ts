import type { Origin } from '#types/common'
import type { CouchDoc } from '#types/couchdb'
import type { EntityUri } from '#types/entity'

export interface RevertMergeSubscription extends CouchDoc {
  event: 'revert-merge'
  uri: EntityUri
  instance: Origin
  timestamp: EpochTimeStamp
  notificationFailed?: {
    attempts: number
    firstAttempt: EpochTimeStamp
    lastAttempt: EpochTimeStamp
  }
}

export type InstanceSubscription = RevertMergeSubscription

export type EventName = InstanceSubscription['event']
