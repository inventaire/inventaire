import type { specialUserDocBase } from '#db/couchdb/hard_coded_documents'
import type userAttributes from '#models/attributes/user'
import type { LatLng, StringifiedHashedSecretData } from '#types/common'
import type { CouchDoc, CouchRevId, CouchUuid } from '#types/couchdb'
import type { PropertyUri } from '#types/entity'
import type { GroupId } from '#types/group'
import type { ImageHash, UserImagePath } from '#types/image'
import type { ReadonlyDeep } from 'type-fest'

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
  'items:count'?: number
  'items:last-add'?: EpochTimeStamp
}

export type UserDataSnapshot = Record<SnapshotVisibilitySectionName, SnapshotVisibilitySection>

export type UserRole = 'admin' | 'dataadmin'

export type UserImg = `/img/users/${ImageHash}`

type OAuthProvider = 'wikidata'

export interface OAuthConsumer {
  consumer_key: string
  consumer_secret: string
}
export interface OAuthProviderTokens {
  token: string
  token_secret: string
}
export type OwnerOnlyOAuthConsumer = OAuthConsumer & OAuthProviderTokens

export interface SpamReport {
  type: 'spam'
  text: string
}
export type AbuseReport = SpamReport

export type Username = string

export interface User extends CouchDoc {
  _id: UserId
  type: 'user'
  username: Username
  stableUsername?: Username
  created: EpochTimeStamp
  email?: Email
  password?: string | StringifiedHashedSecretData
  picture?: UserImagePath
  language?: string
  validEmail?: boolean
  bio?: string
  settings?: UserSettings
  position?: LatLng
  summaryPeriodicity?: number
  token?: StringifiedHashedSecretData
  readToken?: string
  roles?: UserRole[]
  fediversable?: boolean
  customProperties?: PropertyUri[]
  snapshot?: UserDataSnapshot
  deleted?: EpochTimeStamp
  resetPassword?: EpochTimeStamp
  oauth?: Partial<Record<OAuthProvider, OAuthProviderTokens>>
  undeliveredEmail?: number
  lastSummary?: EpochTimeStamp
  lastNews?: string
  reports?: AbuseReport[]
}

export interface SpecialUser extends ReadonlyDeep<typeof specialUserDocBase> {
  _id: `00000000000000000000000000000${number}`
  _rev: CouchRevId
  // TODO: replace doc.special with doc.type='special'
  type: never
  special: true
  username: string
  stableUsername: never
  roles: never
}

export interface DeletedUser extends Pick<User, typeof userAttributes.critical[number]> {
  type: 'deletedUser'
  deleted: EpochTimeStamp
}

export interface InvitedUser extends CouchDoc {
  _id: UserId
  type: 'invited'
  email: Email
  inviters: Record<UserId, EpochTimeStamp>
  invitersGroups?: Record<GroupId, UserId>
}

export type DocInUserDb = User | InvitedUser | DeletedUser | SpecialUser
export type DocWithUsernameInUserDb = User | DeletedUser | SpecialUser
