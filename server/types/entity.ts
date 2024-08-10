import type { allLocallyEditedEntitiesTypes } from '#controllers/entities/lib/properties/properties'
import type { PropertiesValuesConstraints } from '#controllers/entities/lib/properties/properties_values_constraints'
import type { allowlistedReferenceProperties } from '#controllers/entities/lib/validate_and_format_claim'
import type { getWikimediaThumbnailData } from '#data/commons/thumb'
import type { indexedEntitiesTypes } from '#db/elasticsearch/indexes'
import type { ExtraWdPropertyUri } from '#lib/wikidata/allowlisted_properties'
import type { Url } from '#types/common'
import type { CouchDoc, CouchUuid } from '#types/couchdb'
import type { ImageHash } from '#types/image'
import type { OverrideProperties, Writable } from 'type-fest'
import type { WikimediaLanguageCode, SitelinkBadges, Item as WdItem, Claims as WdClaims, GetSitelinkUrlOptions } from 'wikibase-sdk'

export type WdEntityId = `Q${number}`
export type WdPropertyId = `P${number}`
export type WdEntityUri = `wd:${WdEntityId}`
export type WdPropertyUri = `wdt:${WdPropertyId}`

export type InvEntityId = CouchUuid
export type InvEntityUri = `inv:${InvEntityId}`
export type InvPropertyUri = `invp:P${number}`

export type Isbn = string
export type NormalizedIsbn = `${number}`
export type IsbnEntityUri = `isbn:${NormalizedIsbn}`

export type EntityUriPrefix = 'wd' | 'inv' | 'isbn'
export type EntityId = WdEntityId | InvEntityId | NormalizedIsbn

export type PropertyUri = WdPropertyUri | InvPropertyUri

export type EntityUri = WdEntityUri | InvEntityUri | IsbnEntityUri

export type Term = string
export type Label = Term
export type SingleValueTerms = Partial<Record<WikimediaLanguageCode, Term>>
export type SingleValueTermsFromClaims = { fromclaims?: Term }
export type SingleValueTermsWithInferredValues = Partial<Record<WikimediaLanguageCode | 'fromclaims', Term>>
export type Labels = SingleValueTerms
export type LabelsAndInferredLabels = SingleValueTermsWithInferredValues
export type Descriptions = SingleValueTerms
export type DescriptionsAndInferredDescriptions = SingleValueTermsWithInferredValues
export type LabelsFromClaims = SingleValueTermsFromClaims
export type DescriptionsFromClaims = SingleValueTermsFromClaims

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

export type ReferenceProperty = typeof allowlistedReferenceProperties[number]
export type Reference = Partial<Record<ReferenceProperty, ClaimValueByProperty[ReferenceProperty][]>>

export interface InvClaimObject {
  value: InvClaimValue
  references: Reference[]
}

export interface DatatypedInvClaimObject <T> {
  value: T
  references: Reference[]
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
export type ClaimByDatatype = {
  [Datatype in keyof ClaimValueTypeByDatatype]: ClaimValueTypeByDatatype[Datatype] |
  DatatypedInvClaimObject<ClaimValueTypeByDatatype[Datatype]>
}

export type TypedPropertyUri = keyof ClaimValueByProperty

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
export type ExpandedClaims = Partial<{
  [Property in keyof ClaimValueByProperty]: ClaimObjectByProperty[Property][]
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
export type ExtendedEntityType = EntityType | 'article' | 'movement' | 'genre' | 'language' | 'subject' | 'meta'

export type PluralizedIndexedEntityType = typeof indexedEntitiesTypes[number]

export interface RedirectFromTo {
  from: EntityUri
  to: EntityUri
}

export interface SerializedInvEntity extends OverrideProperties<InvEntity, {
  type?: EntityType
  claims: SimplifiedClaims
  labels: LabelsAndInferredLabels
}> {
  uri: InvEntityUri | IsbnEntityUri
  _meta_type?: 'entity'
  originalLang?: WikimediaLanguageCode
  image: {
    url?: EntityImg
  }
  redirects?: RedirectFromTo
  descriptions?: DescriptionsFromClaims
  popularity?: number
}

export type SerializedInvPrefixedInvEntity = OverrideProperties<SerializedInvEntity, {
  uri: InvEntityUri
}>

export type SerializedIsbnEntity = OverrideProperties<SerializedInvEntity, {
  uri: IsbnEntityUri
}>

export type SerializedRemovedPlaceholder = OverrideProperties<SerializedInvPrefixedInvEntity, {
  _meta_type: 'removed:placeholder'
}>

export type SimplifiedLanguageAliases = Term[]
export type SimplifiedAliases = Partial<Record<WikimediaLanguageCode, SimplifiedLanguageAliases>>
export type SimplifiedDescriptions = Partial<Record<WikimediaLanguageCode, Term>>

export interface SimplifiedSitelink {
  title: string
  badges?: SitelinkBadges
}

export type SitelinkKey = GetSitelinkUrlOptions['site']
export type SimplifiedSitelinks = Partial<Record<SitelinkKey, SimplifiedSitelink>>

export type ExtraWdSnakValue = WikimediaCommonsFilename
export type ExtraWdSimplifiedClaims = Record<ExtraWdPropertyUri, (InvSnakValue | ExtraWdSnakValue)[]>
export type ExtraWdExpandedClaims = Record<ExtraWdPropertyUri, ({ value: InvSnakValue | ExtraWdSnakValue })[]>

export type SimplifiedClaimsIncludingWdExtra = SimplifiedClaims & ExtraWdSimplifiedClaims
export type ExpandedClaimsIncludingWdExtra = ExpandedClaims & ExtraWdExpandedClaims

export interface SerializedWdEntity {
  uri: WdEntityUri
  type?: EntityType
  labels: LabelsAndInferredLabels
  aliases: SimplifiedAliases
  descriptions: DescriptionsAndInferredDescriptions
  claims: SimplifiedClaimsIncludingWdExtra
  sitelinks: SimplifiedSitelinks
  originalLang?: WikimediaLanguageCode
  redirects?: WdItem['redirects']
  image: ReturnType<typeof getWikimediaThumbnailData>
  popularity?: number
}

export type SerializedEntity = SerializedInvEntity | SerializedRemovedPlaceholder | SerializedWdEntity

export type SerializedEntitiesByUris = Record<WdEntityUri, SerializedWdEntity> & Record<IsbnEntityUri, SerializedIsbnEntity> & Record<InvEntityUri, SerializedInvPrefixedInvEntity | SerializedRemovedPlaceholder>

export type ExpandedSerializedWdEntity = OverrideProperties<SerializedWdEntity, { claims: ExpandedClaimsIncludingWdExtra }>
export type ExpandedSerializedIsbnEntity = OverrideProperties<SerializedIsbnEntity, { claims: ExpandedClaims }>
export type ExpandedSerializedInvPrefixedInvEntity = OverrideProperties<SerializedInvPrefixedInvEntity, { claims: ExpandedClaims }>
export type ExpandedSerializedRemovedPlaceholder = OverrideProperties<SerializedRemovedPlaceholder, { claims: ExpandedClaims }>

export type ExpandedSerializedEntitiesByUris = Record<WdEntityUri, ExpandedSerializedWdEntity> & Record<IsbnEntityUri, ExpandedSerializedIsbnEntity> & Record<InvEntityUri, ExpandedSerializedInvPrefixedInvEntity | ExpandedSerializedRemovedPlaceholder>

export type ExpandedSerializedEntity = ExpandedSerializedWdEntity | ExpandedSerializedIsbnEntity | ExpandedSerializedInvPrefixedInvEntity | ExpandedSerializedRemovedPlaceholder
