import type listingAttributes from '#models/attributes/listing'
import type { CouchDoc, CouchUuid } from '#types/couchdb'
import type { ListingElement } from '#types/element'
import type { UserId } from '#types/user'
import type { VisibilityKey } from '#types/visibility'

export type ListingId = CouchUuid

export type ListingType = typeof listingAttributes.type[number]

export interface Listing extends CouchDoc {
  _id: ListingId
  type: ListingType
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
