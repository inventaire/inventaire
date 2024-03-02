import type { allLocallyEditedEntitiesTypes, localPropertiesUris } from '#controllers/entities/lib/properties/properties'
import type { CouchDoc, CouchUuid, ImageHash, Url } from '#types/common'
import type { WikimediaLanguageCode } from 'wikibase-sdk'

export type WdEntityId = `Q${number}`
export type WdPropertyId = `P${number}`
export type WdEntityUri = `wd:${WdEntityId}`
export type WdPropertyUri = `wdt:${WdPropertyId}`
export type PropertyUri = WdPropertyUri | InvPropertyUri

export type InvEntityId = CouchUuid
export type InvEntityUri = `inv:${InvEntityId}`
export type InvPropertyUri = `invp:P${number}`

export type Isbn = string
export type IsbnEntityUri = `isbn:${Isbn}`

export type EntityUri = WdEntityUri | InvEntityUri | IsbnEntityUri

export type Label = string
export type Labels = Partial<Record<WikimediaLanguageCode, Label>>

export type EntityValue = WdEntityUri | InvEntityUri
export type StringValue = string
export type ExternalIdValue = string
export type UrlValue = Url
export type DateValue = string
export type PositiveIntegerValue = number
export type PositiveIntegerStringValue = `${number}`
export type ImageValue = ImageHash

export type InvClaimValue = EntityValue | StringValue | ExternalIdValue | UrlValue | DateValue | PositiveIntegerValue | PositiveIntegerStringValue | ImageValue

export type InvPropertyClaims = InvClaimValue[]

export type LocalPropertyUri = typeof localPropertiesUris[number]

export type LocalClaims = Partial<Record<LocalPropertyUri, InvPropertyClaims>>
export type Claims = Partial<Record<PropertyUri, InvPropertyClaims>>

export interface InvEntity extends CouchDoc {
  type: 'entity'
  labels: Labels
  claims: LocalClaims
  created: EpochTimeStamp
  updated?: EpochTimeStamp
  version: number
}

export interface RemovedPlaceholderEntity extends Omit<InvEntity, 'type'> {
  type: 'removed:placeholder'
}

export interface EntityRedirection extends Omit<InvEntity, 'labels' | 'claims'> {
  redirect: EntityUri
  removedPlaceholdersIds: InvEntityId[]
}

export type InvEntityDoc = InvEntity | RemovedPlaceholderEntity | EntityRedirection

export type EntityImg = `/img/entities/${ImageHash}`

export type EntityType = typeof allLocallyEditedEntitiesTypes[number]
