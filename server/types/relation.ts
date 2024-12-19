import type { statuses } from '#models/relation'
import type { CouchDoc } from '#types/couchdb'
import type { UserId } from '#types/user'

export type RelationId = `${UserId}:${UserId}`
export type RelationStatus = typeof statuses[number]

export interface Relation extends CouchDoc {
  _id: RelationId
  status: RelationStatus
  created: EpochTimeStamp
  updated?: EpochTimeStamp
}
