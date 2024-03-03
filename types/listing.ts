import type { CouchDoc, CouchUuid } from '#types/common'
import type { ListingElement } from '#types/element'
import type { UserId } from '#types/user'
import type { VisibilityKey } from '#types/visibility'

export type ListingId = CouchUuid

export interface Listing extends CouchDoc {
  name: string
  description?: string
  creator: UserId
  visibility: VisibilityKey[]
  created: EpochTimeStamp
  updated?: EpochTimeStamp
}

export interface ListingWithElements extends Listing {
  elements: ListingElement[]
}
