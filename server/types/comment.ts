import type { CouchDoc, CouchUuid } from '#types/couchdb'
import type { TransactionId } from '#types/transaction'
import type { UserId } from '#types/user'

export type CommentId = CouchUuid

export interface TransactionComment extends CouchDoc {
  _id: CouchUuid
  user: UserId
  message: string
  transaction: TransactionId
  created: EpochTimeStamp
}
