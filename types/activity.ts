import type { CouchDoc, Url } from '#types/common'

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

export interface Activity extends CouchDoc {
  type: string
  actor: NameObj & UriObj
  object: ObjectType
  externalId: string
  content: string
  created: EpochTimeStamp
  updated: EpochTimeStamp
}

export type LocalActorUrl = Url

export type ActivityId = CouchUuid
