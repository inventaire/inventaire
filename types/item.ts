import type { itemTransactionModes } from '#models/attributes/item'
import type { CouchDoc, CouchUuid } from '#types/couchdb'
import type { EntityUri } from '#types/entity'
import type { ShelfId } from '#types/shelf'
import type { TransactionId } from '#types/transaction'
import type { UserId } from '#types/user'
import type { VisibilityKey } from '#types/visibility'

export type ItemId = CouchUuid

export interface ItemHistoryEvent {
  transaction: TransactionId
  previousOwner: UserId
  timestamp: EpochTimeStamp
}

export type ItemTransactionMode = typeof itemTransactionModes[number]

export interface Item extends CouchDoc {
  created: EpochTimeStamp
  updated?: EpochTimeStamp
  owner: UserId
  transaction: ItemTransactionMode
  entity: EntityUri
  shelves: ShelfId[]
  visibility: VisibilityKey[]
  details?: string
  notes?: string
  pictures?: string[]
  history?: ItemHistoryEvent[]
  previousEntity?: EntityUri[]
}
