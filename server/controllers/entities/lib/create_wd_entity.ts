import { getClaimValue, getFirstClaimValue } from '#controllers/entities/lib/inv_claims_utils'
import { getWikidataOAuthCredentials, validateWikidataOAuth } from '#controllers/entities/lib/wikidata_oauth'
import { newError } from '#lib/error/error'
import { arrayIncludes, mapKeysValues, objectEntries } from '#lib/utils/base'
import { requireJson } from '#lib/utils/json'
import { log } from '#lib/utils/logs'
import { relocateQualifierProperties } from '#lib/wikidata/data_model_adapter'
import wdEdit from '#lib/wikidata/edit'
import type { EntityUri, EntityValue, ExpandedClaims, InvExpandedPropertyClaims, InvSnakValue, Labels, PropertyUri, Reference, ReferenceProperty, ReferencePropertySnaks, WdEntityId, WdEntityUri, WdPropertyId, InvClaimObject } from '#server/types/entity'
import type { User } from '#server/types/user'
import { getInvEntityType } from './get_entity_type.js'
import { prefixifyWd, unprefixify } from './prefix.js'
import { getPropertyDatatype } from './properties/properties_values_constraints.js'
import { validateInvEntity } from './validate_entity.js'
import type { SimplifiedQualifiers, WikimediaLanguageCode } from 'wikibase-sdk'

const wmLanguageCodeByWdId = requireJson('wikidata-lang/mappings/wm_code_by_wd_id.json')

const allowlistedEntityTypes = [ 'work', 'serie', 'human', 'publisher', 'collection' ]

interface CreateWdEntityParams {
  labels: Labels
  claims: ExpandedClaims
  user: User
  isAlreadyValidated: boolean
}

interface EntityDraft {
  labels: Labels
  claims: ExpandedClaims
}

type UnprefixedClaimValue = Omit<InvSnakValue, EntityValue> | WdEntityId
type UnprefixedClaimObject = {
  value: UnprefixedClaimValue
  references?: Reference[]
  qualifiers?: SimplifiedQualifiers
}
export type UnprefixedClaims = Record<WdPropertyId, UnprefixedClaimObject[]>

export async function createWdEntity (params: CreateWdEntityParams) {
  const { labels, claims, user, isAlreadyValidated } = params
  validateWikidataOAuth(user)
  const credentials = getWikidataOAuthCredentials(user)

  const entity: EntityDraft = { labels, claims }

  log(entity, 'wd entity creation')

  if (!isAlreadyValidated) await validateInvEntity(entity)
  validateWikidataCompliance(entity)
  const formattedEntity = format(entity)
  const res = await wdEdit.entity.create(formattedEntity, { credentials })
  const { entity: createdEntity } = res
  if (createdEntity == null) {
    throw newError('invalid wikidata-edit response', 500, { res })
  }
  createdEntity.uri = prefixifyWd(createdEntity.id)
  return createdEntity
}

function validateWikidataCompliance (entity: EntityDraft) {
  const { claims } = entity
  if (claims == null) throw newError('invalid entity', 400, { entity })

  const entityType = getInvEntityType(claims['wdt:P31'])
  if (!arrayIncludes(allowlistedEntityTypes, entityType)) {
    throw newError('invalid entity type', 400, { entityType, entity })
  }

  for (const [ property, propertyClaims ] of objectEntries(claims)) {
    if (getPropertyDatatype(property) === 'entity') {
      for (const claim of propertyClaims) {
        const value = getClaimValue(claim) as EntityUri
        if (value.split(':')[0] === 'inv') {
          throw newError('claim value is an inv uri', 400, { property, value })
        }
      }
    }
  }

  return entity
}

function format (entity: EntityDraft) {
  entity.claims = mapKeysValues(entity.claims, (property, propertyClaims) => {
    return [
      unprefixify(property),
      unprefixifyClaims(property, propertyClaims),
    ]
  }) as UnprefixedClaims
  // Relocate qualifier properties after unprefixifying,
  // as the unprefixifyClaims function doesn't handle qualifiers
  relocateQualifierProperties(entity)
  reshapeMonolingualTextClaims(entity)
  return entity
}

function unprefixifyClaims (property: PropertyUri, propertyClaims: InvExpandedPropertyClaims) {
  return propertyClaims.map(claim => {
    const { value, references = [] } = claim
    const unprefixedValue = (getPropertyDatatype(property) === 'entity') ? unprefixify(value as WdEntityUri) : value
    return {
      value: unprefixedValue,
      references: references.map(unprefixifyReference),
    }
  })
}

function unprefixifyReference (reference: Reference) {
  return mapKeysValues(reference, (property, propertyValues) => {
    return [
      unprefixify(property),
      unprefixifySnakValues(property, propertyValues),
    ]
  })
}

function unprefixifySnakValues (property: ReferenceProperty, propertyValues: ReferencePropertySnaks) {
  if (getPropertyDatatype(property) === 'entity') {
    return propertyValues.map(unprefixify)
  } else {
    return propertyValues
  }
}

const monolingualProperties = [
  'wdt:P1476',
  'wdt:P1680',
] as const satisfies PropertyUri[]

function reshapeMonolingualTextClaims (entity: EntityDraft) {
  const { claims } = entity
  if (!monolingualProperties.find(property => claims[property])) return
  const languageUri = getFirstClaimValue(claims, 'wdt:P407') as WdEntityUri
  if (!languageUri) {
    throw newError('monolingual text claims can not be reshaped in absence of a language claim', 400, { entity })
  }
  const langWdId = unprefixify(languageUri)
  const languageCode = wmLanguageCodeByWdId[langWdId] as WikimediaLanguageCode
  if (!languageCode) {
    throw newError('wikimedia language code not found', 400, { langWdId })
  }
  for (const property of monolingualProperties) {
    reshapeMonolingualTextPropertyClaims(claims, property, languageCode)
  }
}

function reshapeMonolingualTextPropertyClaims (claims: ExpandedClaims, property: PropertyUri, languageCode: WikimediaLanguageCode) {
  if (!claims[property]) return
  claims[property] = claims[property].map((claimObject: InvClaimObject) => {
    const { value, references } = claimObject
    return {
      value: { text: value, language: languageCode },
      references,
    }
  })
}
