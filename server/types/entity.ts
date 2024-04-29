import type { allLocallyEditedEntitiesTypes } from '#controllers/entities/lib/properties/properties'
import type { PropertiesValuesConstraints } from '#controllers/entities/lib/properties/properties_values_constraints'
import type { getWikimediaThumbnailData } from '#data/commons/thumb'
import type { indexedEntitiesTypes } from '#db/elasticsearch/indexes'
import type { Url } from '#types/common'
import type { CouchDoc, CouchUuid } from '#types/couchdb'
import type { ImageHash } from '#types/image'
import type { OverrideProperties, Writable } from 'type-fest'
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

export type EntityUriPrefix = 'wd' | 'inv' | 'isbn'
export type EntityId = WdEntityId | InvEntityId | Isbn

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

export type InvSnakValue = EntityValue | StringValue | ExternalIdValue | UrlValue | DateValue | PositiveIntegerValue | PositiveIntegerStringValue | ImageValue
export type InvClaimValue = InvSnakValue

export type Reference = Record<PropertyUri, InvSnakValue[]>

export interface InvClaimObject {
  value: InvClaimValue
  references: Reference[]
}

export interface ClaimValueTypeByDatatype {
  'entity': EntityValue
  'string': StringValue
  'external-id': ExternalIdValue
  'url': UrlValue
  'date': DateValue
  'positive-integer': PositiveIntegerValue
  'positive-integer-string': PositiveIntegerStringValue
  'image': ImageValue
}

export type ClaimValueByProperty = {
  [Property in keyof Writable<PropertiesValuesConstraints>]: ClaimValueTypeByDatatype[PropertiesValuesConstraints[Property]['datatype']]
}
export type ClaimObjectByProperty = {
  [Property in keyof Writable<PropertiesValuesConstraints>]: {
    value: ClaimValueTypeByDatatype[PropertiesValuesConstraints[Property]['datatype']]
    references: Reference[]
  }
}
export type ClaimByProperty = {
  [Property in keyof Writable<PropertiesValuesConstraints>]: ClaimValueByProperty[Property] | ClaimObjectByProperty[Property]
}

export type InvClaim = InvClaimObject | InvClaimValue
export type InvPropertyClaims = InvClaim[]
export type InvSimplifiedPropertyClaims = InvClaimValue[]
export type InvExpandedPropertyClaims = InvClaimObject[]

export type Claims = Partial<{
  [Property in keyof ClaimValueByProperty]: ClaimByProperty[Property][]
}>
export type SimplifiedClaims = Partial<{
  [Property in keyof ClaimValueByProperty]: ClaimValueByProperty[Property][]
}>

export type WdRawClaims = WdClaims

export interface InvEntity extends CouchDoc {
  _id: InvEntityId
  type: 'entity'
  labels: Labels
  claims: Claims
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
export type ExtendedEntityType = EntityType | 'article' | 'movement' | 'genre' | 'language' | 'subject'

export type PluralizedIndexedEntityType = typeof indexedEntitiesTypes[number]

export interface SerializedInvEntity extends OverrideProperties<InvEntity, { type?: EntityType, claims: SimplifiedClaims }> {
  _meta_type: 'entity'
  uri: InvEntityUri | IsbnEntityUri
  originalLang?: WikimediaLanguageCode
  image: {
    url?: EntityImg
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
  claims: SimplifiedClaims
  sitelinks: SimplifiedSitelinks
  originalLang?: WikimediaLanguageCode
  redirects?: WdItem['redirects']
  image: ReturnType<typeof getWikimediaThumbnailData>
}

export type SerializedEntity = SerializedInvEntity | SerializedRemovedPlaceholder | SerializedWdEntity

export type SerializedEntitiesByUris = Record<EntityUri, SerializedEntity>
