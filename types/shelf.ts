import type { CouchDoc, CouchUuid } from '#types/common'
import type { UserId } from '#types/user'
import type { VisibilityKey } from '#types/visibility'

export type ShelfId = CouchUuid

export type ColorHexCode = `#${number}`

export interface Shelf extends CouchDoc {
  name: string
  slug: string
  description?: string
  owner: UserId
  visibility: VisibilityKey[]
  color: ColorHexCode
  created: EpochTimeStamp
  updated?: EpochTimeStamp
}
