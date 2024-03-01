import type { localPropertiesUris } from '#controllers/entities/lib/properties/properties'
import type { CouchDoc, CouchUuid, ImageHash, Url } from '#types/common'
import type { WikimediaLanguageCode } from 'wikibase-sdk'

export type WdPropertyUri = `wdt:P${number}`
export type InvPropertyUri = `invp:P${number}`
export type PropertyUri = WdPropertyUri | InvPropertyUri

export type WdEntityId = `Q${number}`
export type WdEntityUri = `wd:${WdEntityId}`

export type InvEntityId = CouchUuid
export type InvEntityUri = `inv:${InvEntityId}`

export type Isbn = string
export type IsbnEntityUri = `isbn:${Isbn}`

export type EntityUri = WdEntityUri | InvEntityUri | IsbnEntityUri

export type Label = string

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

export type Claims = Record<PropertyUri, InvPropertyClaims>

type LocalPropertyUri = typeof localPropertiesUris[number]

export interface InvEntity extends CouchDoc {
  type: 'entity'
  labels: Record<WikimediaLanguageCode, Label>
  claims: Record<LocalPropertyUri, InvPropertyClaims>
  created: EpochTimeStamp
  version: number
}

export type EntityImg = `/img/entities/${ImageHash}`
