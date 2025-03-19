import { difference } from 'lodash-es'
import { getEntityByUri } from '#controllers/entities/lib/get_entity_by_uri'
import { getClaimValue, setClaimValue } from '#controllers/entities/lib/inv_claims_utils'
import { getReverseClaims } from '#controllers/entities/lib/reverse_claims'
import { newError } from '#lib/error/error'
import type { ErrorContext } from '#lib/error/format_error'
import type { AccessLevel } from '#lib/user_access_levels'
import { arrayIncludes } from '#lib/utils/base'
import type { EntityType, EntityUri, ExtendedEntityType, InvClaim, InvClaimValue, InvEntityId, InvEntityUri, PropertyUri } from '#types/entity'
import { propertiesValuesConstraints as properties } from './properties/properties_values_constraints.js'
import { validateClaimValueSync } from './validate_claim_sync.js'

export interface ValidateAndFormatClaimValueParams {
  type: ExtendedEntityType
  property: PropertyUri
  oldClaim?: InvClaim
  newClaim?: InvClaim
  letEmptyValuePass: boolean
  userAccessLevels?: AccessLevel[]
  _id: InvEntityId
}

export async function validateAndFormatClaimValue (params: ValidateAndFormatClaimValueParams) {
  const { type, property, oldClaim, newClaim, letEmptyValuePass, userAccessLevels = [], _id } = params
  const oldVal = getClaimValue(oldClaim)
  let newVal = getClaimValue(newClaim)

  const prop = properties[property]

  // If no old value is passed, it's a claim creation, not an update
  const updatingValue = (oldVal != null)

  const { editAccessLevel, updateAccessLevel } = prop

  if (editAccessLevel && !arrayIncludes(userAccessLevels, editAccessLevel)) {
    // Ex: only admins can edit invp:P3
    throw newError(`editing property requires ${editAccessLevel}'s rights`, 403, { property, newVal })
  } else if (updatingValue && updateAccessLevel && !arrayIncludes(userAccessLevels, updateAccessLevel)) {
    // Ex: a user can freely set a wdt:P212 value, but only an admin can change it
    throw newError(`updating property requires ${updateAccessLevel}'s rights`, 403, { property, newVal })
  }

  // letEmptyValuePass to let it be interpreted as a claim deletion
  if (letEmptyValuePass && newVal == null) return null

  if (typeof newVal === 'string') newVal = newVal.trim().normalize()
  validateClaimValueSync(property, newVal, type)

  const formattedValue: InvClaimValue = prop.format != null ? prop.format(newVal) : newVal

  const { concurrency, entityValueTypes } = prop

  try {
    await Promise.all([
      verifyClaimConcurrency(concurrency, property, formattedValue, _id),
      entityValueTypes != null ? verifyClaimEntityType(entityValueTypes, formattedValue as EntityUri) : null,
    ])
  } catch (err) {
    // Pass-on cause error context
    // Known use: required by tests relying on knowning the entity matching that concurrent claim
    const context: ErrorContext = 'context' in err ? err.context : {}
    Object.assign(context, { property, value: newVal })
    const invalidClaimValueError = newError(`invalid claim value: ${err.message}`, 400, context)
    err.name = 'InvalidClaimValueError'
    invalidClaimValueError.cause = err
    throw invalidClaimValueError
  }

  return setClaimValue(newClaim, formattedValue)
}

// For properties that don't tolerate having several entities
// sharing the same value
async function verifyClaimConcurrency (concurrency = false, property: PropertyUri, value: InvClaimValue, _id: InvEntityId) {
  if (!concurrency) return

  let invEntity
  const entityUris: EntityUri[] = []
  if (_id) {
    const invUri = `inv:${_id}` as InvEntityUri
    invEntity = await getEntityByUri({ uri: invUri })
    entityUris.push(invUri)
    if (invEntity.uri !== invUri) entityUris.push(invEntity.uri)
  }

  let uris = await getReverseClaims({ property, value, refresh: true })

  uris = difference(uris, entityUris)

  if (uris.length > 0) {
    // /!\ The client relies on this exact message
    // client/app/modules/entities/lib/creation_partials.js
    const message = 'this property value is already used'
    const entity = uris[0]
    // /!\ The client relies on the entity being passed in the context
    throw newError(message, 400, { entity, property, value })
  }
}

// For claims that have an entity URI as value
// check that the target entity is of the expected type
async function verifyClaimEntityType (entityValueTypes: EntityType[], value: EntityUri) {
  const entity = await getEntityByUri({ uri: value })
  if (!entity) {
    throw newError('entity not found', 400, { value })
  }
  if (!arrayIncludes(entityValueTypes, entity.type)) {
    throw newError(`invalid claim entity type: ${entity.type}`, 400, { value })
  }
}
