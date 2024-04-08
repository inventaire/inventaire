import type { allLocallyEditedEntitiesTypes, localPropertiesUris } from '#controllers/entities/lib/properties/properties'
import type { indexedEntitiesTypes } from '#db/elasticsearch/indexes'
import type { ImageHash, Url } from '#types/common'
import type { CouchDoc, CouchUuid } from '#types/couchdb'
import type { OverrideProperties } from 'type-fest'
import type { WikimediaLanguageCode, SitelinkBadges, Item as WdItem, Claims as WdClaims } from 'wikibase-sdk'

export type WdEntityId = `Q${number}`
export type WdPropertyId = `P${number}`
export type WdEntityUri = `wd:${WdEntityId}`
export type WdPropertyUri = `wdt:${WdPropertyId}`

export type InvEntityId = CouchUuid
export type InvEntityUri = `inv:${InvEntityId}`
export type InvPropertyUri = `invp:P${number}`

export type PropertyUri = WdPropertyUri | InvPropertyUri
export type Isbn = string
export type IsbnEntityUri = `isbn:${Isbn}`

export type EntityUri = WdEntityUri | InvEntityUri | IsbnEntityUri

export type Term = string
export type Label = Term
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
export type WdRawClaims = WdClaims

export interface InvEntity extends CouchDoc {
  _id: InvEntityId
  type: 'entity'
  labels: Labels
  claims: LocalClaims
  created: EpochTimeStamp
  updated?: EpochTimeStamp
  version: number
}

export type RemovedPlaceholderEntity = OverrideProperties<InvEntity, { type: 'removed:placeholder' }>
export type RemovedPlaceholdersIds = InvEntityId[]

export interface EntityRedirection extends Omit<InvEntity, 'labels' | 'claims'> {
  redirect: EntityUri
  removedPlaceholdersIds: RemovedPlaceholdersIds
}

export type InvEntityDoc = InvEntity | RemovedPlaceholderEntity | EntityRedirection

export type EntityImg = `/img/entities/${ImageHash}`

// No `File:` prefix (ex: 'Victor Hugo by Étienne Carjat 1876 - full.jpg')
export type WikimediaCommonsFilename = string

export type EntityType = typeof allLocallyEditedEntitiesTypes[number]

export type PluralizedIndexedEntityType = typeof indexedEntitiesTypes[number]

export interface SerializedInvEntity extends OverrideProperties<InvEntity, { type?: EntityType }> {
  _meta_type: 'entity'
  uri: InvEntityUri | IsbnEntityUri
  originalLang?: WikimediaLanguageCode
  image?: {
    url: EntityImg
  }
  redirects?: { from: InvEntityUri, to: EntityUri }
}

export type SerializedRemovedPlaceholder = OverrideProperties<SerializedInvEntity, {
  _meta_type: 'removed:placeholder'
}>

export type SimplifiedLanguageAliases = Term[]
export type SimplifiedAliases = Partial<Record<WikimediaLanguageCode, SimplifiedLanguageAliases>>
export type SimplifiedDescriptions = Partial<Record<WikimediaLanguageCode, Term>>

export interface SimplifiedSitelink {
  title: string
  badges?: SitelinkBadges
}
export type SimplifiedSitelinks = Partial<Record<WikimediaLanguageCode, SimplifiedSitelink>>

export interface SerializedWdEntity {
  uri: WdEntityUri
  type?: EntityType
  labels: Labels
  aliases: SimplifiedAliases
  descriptions: SimplifiedDescriptions
  claims: Claims
  sitelinks: SimplifiedSitelinks
  originalLang?: WikimediaLanguageCode
  redirects?: WdItem['redirects']
  image?: {
    url: WikimediaCommonsFilename
  }
}

export type SerializedEntity = SerializedInvEntity | SerializedRemovedPlaceholder | SerializedWdEntity

export type SerializedEntitiesByUris = Record<EntityUri, SerializedEntity>
