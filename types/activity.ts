import type { CouchDoc, Url } from '#types/common'

export interface Activity extends CouchDoc {
  type: string
  actor: string
  object: string
  externalId: string
  content: string
  created: EpochTimeStamp
  updated: EpochTimeStamp
}

export type LocalActorUrl = Url
