import type { CouchDoc, CouchUuid } from '#types/couchdb'
import type { EntityUri } from '#types/entity'
import type { UserId } from '#types/user'
import type { EntityType } from 'wikibase-sdk'

export type TaskId = CouchUuid
export type TaskType = string
export type TaskState = 'merged'

export interface externalSourceOccurrence {
  uri: EntityUri
  matchedTitles: string[]
  structuredDataSource: boolean
}

export interface Task extends CouchDoc {
  _id: TaskId
  type: TaskType
  state?: TaskState
  suspectUri: EntityUri
  suggestionUri: EntityUri
  created: EpochTimeStamp
  lexicalScore?: number
  relationScore?: number
  entitiesType: EntityType
  externalSourcesOccurrences?: externalSourceOccurrence[]
  reporter?: UserId
  clue?: string
}
