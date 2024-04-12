import type { ColorHexCode } from '#types/common'
import type { CouchDoc, CouchUuid } from '#types/couchdb'
import type { UserId } from '#types/user'
import type { VisibilityKey } from '#types/visibility'

export type ShelfId = CouchUuid

export interface Shelf extends CouchDoc {
  _id: ShelfId
  name: string
  slug: string
  description?: string
  owner: UserId
  visibility: VisibilityKey[]
  color: ColorHexCode
  created: EpochTimeStamp
  updated?: EpochTimeStamp
}
