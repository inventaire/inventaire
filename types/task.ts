import type { CouchDoc } from '#types/common'
import type { EntityUri } from '#types/entity'
import type { UserId } from '#types/user'
import type { EntityType } from 'wikibase-sdk'

export type TaskType = string

export interface externalSourceOccurrence {
  uri: EntityUri
  matchedTitles: string[]
  structuredDataSource: boolean
}

export interface Task extends CouchDoc {
  type: TaskType
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
