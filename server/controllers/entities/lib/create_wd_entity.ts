import { getClaimValue } from '#controllers/entities/lib/inv_claims_utils'
import { getWikidataOAuthCredentials, validateWikidataOAuth } from '#controllers/entities/lib/wikidata_oauth'
import { newError } from '#lib/error/error'
import { mapKeysValues, objectEntries } from '#lib/utils/base'
import { log } from '#lib/utils/logs'
import { relocateQualifierProperties } from '#lib/wikidata/data_model_adapter'
import wdEdit from '#lib/wikidata/edit'
import type { Claims, DatatypedInvClaimObject, EntityUri, EntityValue, ExpandedClaims, InvExpandedPropertyClaims, InvSnakValue, Labels, PropertyUri, Reference, ReferenceProperty, ReferencePropertySnaks, WdEntityId, WdEntityUri, WdPropertyId } from '#server/types/entity'
import type { User } from '#server/types/user'
import { getEntityType } from './get_entity_type.js'
import { prefixifyWd, unprefixify } from './prefix.js'
import { getPropertyDatatype } from './properties/properties_values_constraints.js'
import { validateInvEntity } from './validate_entity.js'
import type { SimplifiedQualifiers } from 'wikibase-sdk'

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

  await validate(entity, isAlreadyValidated)
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

async function validate (entity, isAlreadyValidated) {
  if (!isAlreadyValidated) return validateInvEntity(entity)
}

function validateWikidataCompliance (entity: EntityDraft) {
  const { claims } = entity
  if (claims == null) throw newError('invalid entity', 400, { entity })

  const entityType = getEntityType(claims['wdt:P31'])
  if (!allowlistedEntityTypes.includes(entityType)) {
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
