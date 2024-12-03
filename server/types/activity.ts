import type { Url, RelativeUrl, AbsoluteUrl } from '#types/common'
import type { CouchDoc, CouchUuid } from '#types/couchdb'
import type { Item } from '#types/item'
import type { WikimediaLanguageCode } from 'wikibase-sdk'

export type ActivityType = 'Create' | 'Delete' | 'Follow' | 'Undo' | 'Accept' | 'Follow'
export type Context = 'https://www.w3.org/ns/activitystreams' | 'https://w3id.org/security/v1'
export type LocalActorUrl = Url

export interface Attachment {
  type: 'PropertyValue'
  name: string
  value?: string
  url?: Url
}

export interface ActorActivity {
  '@context': Context[]
  type: 'Person'
  id: LocalActorUrl
  name: string
  preferredUsername: string
  summary: string
  inbox: Url
  outbox: Url
  publicKey: {
    id: string
    owner: LocalActorUrl
    publicKeyPem?: {
      publicKeyHash: string
    }
  }
  icon?: {
    mediaType: 'image/jpeg'
    type: 'Image'
    url: string
  }
  attachment?: Attachment[]
}

interface BaseActivity {
  '@context'?: any[]
  id: Url
  to?: string[]
  cc?: string[]
  actor?: Url | ActorActivity
  type: ActivityType
}

interface NameObj {
  name: string
}

export interface UriObj {
  uri: string
}

interface ItemsObj {
  items: {
    since: EpochTimeStamp
    until: EpochTimeStamp
  }
}

export type ObjectType = NameObj & ItemsObj & Url

export type Actor = NameObj & UriObj

export interface ActivityDoc extends CouchDoc {
  _id: CouchUuid
  type: ActivityType
  actor: Actor
  object: ObjectType
  externalId: string
  content: string
  created: EpochTimeStamp
  updated: EpochTimeStamp
}

export interface FollowActivity extends BaseActivity {
  type: 'Follow'
  object: Url
}

export interface AcceptActivity extends BaseActivity {
  type: 'Accept'
  object: FollowActivity
}

export type ActivityId = CouchUuid

interface Note {
  name: string
  actor: AbsoluteUrl
  lang?: WikimediaLanguageCode
  parentLink: RelativeUrl
}

export interface ItemNote extends Note {
  allActivitiesItems: Item[]
}

export interface ActivityLink {
  name: 'shelf' | 'inventory' | 'wikidata.org' | string
  url: Url
}

export interface ActorParams {
  actorName: string
  displayName: string
  summary?: string
  imagePath?: string
  links: ActivityLink[]
  attachment?: Attachment[]
}

export interface Outbox {
  '@context': Context[]
  id: Url
  type: 'OrderedCollection'
  first: Url
  next: Url
  totalItems?: number
}
