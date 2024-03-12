import type { itemSnapshotAttributes } from '#models/attributes/item'
import type userAttributes from '#models/attributes/user'
import type { CouchDoc, CouchUuid } from '#types/couchdb'
import type { Item, ItemId, ItemSnapshot, ItemTransactionMode } from '#types/item'
import type { User, UserId } from '#types/user'

export type TransactionId = CouchUuid

// TODO: replace with `typeof transactionStatesList[number]` after fixing the TS1355 error
export type TransactionState = 'requested' | 'accepted' | 'declined' | 'confirmed' | 'returned' | 'cancelled'

export type TransactionUserRole = 'owner' | 'requester'

export interface TransactionAction {
  action: TransactionState
  timestamp: EpochTimeStamp
  actor?: TransactionUserRole
}

export interface TransactionSnapshot {
  item: Pick<Item, typeof itemSnapshotAttributes[number]>
  entity: {
    title?: ItemSnapshot['entity:title']
    image?: ItemSnapshot['entity:image']
    authors?: ItemSnapshot['entity:authors']
  }
  owner: Pick<User, typeof userAttributes['snapshot'][number]>
  requester: Pick<User, typeof userAttributes['snapshot'][number]>
}

export interface Transaction extends CouchDoc {
  _id: TransactionId
  item: ItemId
  owner: UserId
  requester: UserId
  transaction: ItemTransactionMode
  state: TransactionState
  created: EpochTimeStamp
  actions: TransactionAction[]
  read: {
    [key in TransactionUserRole]: boolean
  }
  snapshot: TransactionSnapshot
}
