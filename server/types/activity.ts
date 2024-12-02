import type { Url, RelativeUrl, AbsoluteUrl } from '#types/common'
import type { CouchDoc, CouchUuid } from '#types/couchdb'
import type { Item } from '#types/item'
import type { WikimediaLanguageCode } from 'wikibase-sdk'

export type ActivityType = 'Create' | 'Delete' | 'Follow' | 'Undo'

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

export type LocalActorUrl = Url

export type Actor = NameObj & UriObj

export interface Activity extends CouchDoc {
  _id: CouchUuid
  type: string
  actor: Actor
  object: ObjectType
  externalId: string
  content: string
  created: EpochTimeStamp
  updated: EpochTimeStamp
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

export interface Attachement {
  type: 'PropertyValue'
  name: string
  value?: string
  url?: Url
}

export interface ActivityLink {
  name: 'shelf' | 'inventory' | 'wikidata.org' | string
  url: Url
}

export type Context = 'https://www.w3.org/ns/activitystreams' | 'https://w3id.org/security/v1'

interface Icon {
  mediaType: 'image/jpeg'
  type: 'Image'
  url: string
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
  followers: Url
  publicKey: {
    id: string
    owner: LocalActorUrl
    publicKeyPem?: {
      publicKeyHash: string
    }
  }
  icon?: Icon
  attachment?: Attachement[]
}

export interface ActorParams {
  actorName: string
  displayName: string
  summary?: string
  imagePath?: string
  links: ActivityLink[]
  attachment?: Attachement[]
}

export interface OrderedCollection {
  '@context': Context[]
  id: Url
  type: 'OrderedCollection'
  first: Url
  next: Url
  totalItems?: number
}

export interface RemoteActor {
  id: Url
  icon?: Icon
  name?: string
  preferredUsername?: string
  inbox?: Url
}
