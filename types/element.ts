import type { CouchDoc, CouchUuid } from '#types/common'
import type { EntityUri } from '#types/entity'
import type { ListingId } from '#types/listing'

export type ListingElementId = CouchUuid

// There is already a global type called Element for the DOM object
export interface ListingElement extends CouchDoc {
  list: ListingId
  uri: EntityUri
  created: EpochTimeStamp
}
