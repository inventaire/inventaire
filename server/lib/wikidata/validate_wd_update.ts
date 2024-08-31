import { cloneDeep, indexOf, without } from 'lodash-es'
import { getEntityByUri } from '#controllers/entities/lib/get_entity_by_uri'
import { getStrictEntityType } from '#controllers/entities/lib/get_entity_type'
import { prefixifyWd } from '#controllers/entities/lib/prefix'
import { validateClaimValueSync } from '#controllers/entities/lib/validate_claim_sync'
import { isNonEmptyArray } from '#lib/boolean_validations'
import { newError } from '#lib/error/error'
import { arrayIncludes } from '#lib/utils/base'
import type { EntityValue, ExtendedEntityType, InvClaimValue, SimplifiedClaims, WdEntityId, WdPropertyUri } from '#server/types/entity'

export async function validateWdEntityUpdate (id: WdEntityId, property: WdPropertyUri, oldValue: InvClaimValue, newValue: InvClaimValue) {
  const uri = prefixifyWd(id)
  const entity = await getEntityByUri({ uri, refresh: true })
  const wdtP31Array = entity.claims['wdt:P31']
  const type = getStrictEntityType(entity.claims, uri)
  if (newValue) {
    validateClaimValueSync(property, newValue, type)
  }

  if (property === 'wdt:P31') {
    // Let wikibase-edit reject the update
    if (!isNonEmptyArray(wdtP31Array) || !arrayIncludes(wdtP31Array, oldValue)) return
    validateP31Update(entity.claims, oldValue, newValue as EntityValue, type)
  }
}

export function validateP31Update (claims: SimplifiedClaims, oldValue: EntityValue, newValue: EntityValue, typeBeforeUpdate?: ExtendedEntityType) {
  const wdtP31Array = claims['wdt:P31']
  let postUpdateClaims = cloneDeep(claims)
  const valueIndex = indexOf(wdtP31Array, oldValue)
  if (newValue) {
    postUpdateClaims['wdt:P31'][valueIndex] = newValue
  } else {
    postUpdateClaims['wdt:P31'] = without(postUpdateClaims['wdt:P31'], oldValue)
  }
  const typeAfterUpdate = getStrictEntityType(postUpdateClaims)
  const postUpdateWdtP31Array = postUpdateClaims['wdt:P31']
  if (postUpdateClaims['wdt:P31'].length === 0) {
    throw newError("wdt:P31 array can't be empty", 400, { wdtP31Array, postUpdateWdtP31Array, oldValue, newValue })
  }
  if (typeBeforeUpdate !== typeAfterUpdate) {
    throw newError("This edit would change the entity's type", 400, { wdtP31Array, postUpdateWdtP31Array, typeBeforeUpdate, typeAfterUpdate })
  }
}
