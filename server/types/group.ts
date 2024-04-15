import type { LatLng } from '#types/common'
import type { CouchDoc, CouchUuid } from '#types/couchdb'
import type { ImageHash } from '#types/image'
import type { UserId } from '#types/user'

export type GroupId = CouchUuid

export type GroupImg = `/img/groups/${ImageHash}`

export interface GroupMembership {
  user: UserId
  invitor?: UserId
  timestamp: EpochTimeStamp
}

export interface GroupMemberships {
  admins: GroupMembership[]
  members: GroupMembership[]
  invited: GroupMembership[]
  declined: GroupMembership[]
  requested: GroupMembership[]
}

export type Group = CouchDoc & {
  _id: GroupId
  name: string
  slug: string
  description?: string
  searchable: boolean
  open: boolean
  picture?: GroupImg
  position?: LatLng
  creator: UserId
  created: EpochTimeStamp
} & GroupMemberships

export type GroupMembershipCategory = keyof GroupMemberships
