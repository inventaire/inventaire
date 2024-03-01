import type { CouchDoc, CouchUuid } from '#types/common'
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
