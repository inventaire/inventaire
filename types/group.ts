import type { CouchDoc, CouchUuid, LatLng } from '#types/common'
import type { UserId } from '#types/user'

export type GroupId = CouchUuid

export type GroupImg = `/img/groups/${string}`

export interface GroupMembership {
  user: UserId
  invitor?: UserId
  timestamp: EpochTimeStamp
}

export interface Group extends CouchDoc {
  name: string
  description?: string
  searchable: boolean
  open: boolean
  picture?: GroupImg
  position?: LatLng
  creator: UserId
  created: EpochTimeStamp
  admins: GroupMembership[],
  members: GroupMembership[],
  invited: GroupMembership[],
  declined: GroupMembership[],
  requested: GroupMembership[],
}
