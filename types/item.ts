import type { itemTransactionModes } from '#models/attributes/item'
import type { CouchDoc, CouchUuid } from '#types/couchdb'
import type { EntityImg, EntityUri } from '#types/entity'
import type { ShelfId } from '#types/shelf'
import type { TransactionId } from '#types/transaction'
import type { UserId } from '#types/user'
import type { VisibilityKey } from '#types/visibility'
import type { WikimediaLanguageCode } from 'wikibase-sdk'

export type ItemId = CouchUuid

export interface ItemHistoryEvent {
  transaction: TransactionId
  previousOwner: UserId
  timestamp: EpochTimeStamp
}

export type ItemTransactionMode = typeof itemTransactionModes[number]

export interface Item extends CouchDoc {
  _id: ItemId
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

export interface ItemSnapshot {
  'entity:title'?: string
  'entity:image'?: EntityImg
  'entity:authors'?: string
  'entity:subtitle'?: string
  'entity:lang'?: WikimediaLanguageCode
}

export interface SerializedItem extends Item {
  snapshot?: ItemSnapshot
}
