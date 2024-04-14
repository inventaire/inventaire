import type { GroupId } from '#types/group'
import type { ShelfId } from '#types/shelf'
import type { UserId } from '#types/user'

export interface ItemsSearchQuery {
  user?: GroupId
  group?: ShelfId
  shelf?: UserId
  search: string
  limit?: number
  offset?: number
}
