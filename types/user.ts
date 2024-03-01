import type { CouchDoc, CouchUuid, LatLng } from '#types/common'
import type { PropertyUri } from '#types/entity'

export type UserId = CouchUuid
export type Email = `${string}@${string}`

export interface UserSettings {
  notifications?: {
    global?: boolean
    inventories_activity_summary?: boolean
    friendship_request?: boolean
    friend_accepted_request?: boolean
    group_invite?: boolean
    your_item_was_requested?: boolean
    update_on_item_you_requested?: boolean
    update_on_your_item?: boolean
    group_acceptRequest?: boolean
    group_join_request?: boolean
  }
  contributions?: {
    anonymize?: boolean
  }
}

export type SnapshotVisibilitySectionName = 'private' | 'network' | 'public'

export interface SnapshotVisibilitySection {
  'items:count'?: number,
  'items:last-add'?: EpochTimeStamp
}

export type UserDataSnapshot = Record<SnapshotVisibilitySectionName, SnapshotVisibilitySection>

export type UserRole = 'admin' | 'dataadmin'

export type CreationStrategy = 'local' | 'browserid'

export type UserImg = `/img/users/${string}`

export interface User extends CouchDoc {
  type: 'user' | 'deletedUser'
  username: string
  stableUsername?: string
  created: EpochTimeStamp
  creationStrategy: CreationStrategy
  email?: Email
  password?: string
  picture?: string
  language?: string
  validEmail?: boolean
  bio?: string
  settings?: UserSettings
  position?: LatLng
  summaryPeriodicity?: number
  readToken?: string
  roles?: UserRole[]
  fediversable?: boolean
  customProperties?: PropertyUri[]
  snapshot?: UserDataSnapshot
  deleted?: EpochTimeStamp
  resetPassword?: EpochTimeStamp
}
