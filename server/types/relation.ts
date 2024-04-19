import type { statuses } from '#models/relation'
import type { CouchDoc } from '#types/couchdb'
import type { UserId } from '#types/user'

export type RelationId = `${UserId}:${UserId}`

export interface Relation extends CouchDoc {
  _id: RelationId
  type: 'relation'
  status: typeof statuses[number]
  created: EpochTimeStamp
}
