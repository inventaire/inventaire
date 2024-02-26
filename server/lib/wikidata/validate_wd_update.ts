import { cloneDeep, without } from 'lodash-es'
import { getEntityByUri } from '#controllers/entities/lib/get_entity_by_uri'
import getEntityType from '#controllers/entities/lib/get_entity_type'
import validateClaimValueSync from '#controllers/entities/lib/validate_claim_value_sync'
import { isNonEmptyArray } from '#lib/boolean_validations'
import { error_ } from '#lib/error/error'

export async function validateWdEntityUpdate ({ id, property, oldValue, newValue }) {
  const entity = await getEntityByUri({ uri: `wd:${id}`, refresh: true })
  const wdtP31Array = entity.claims['wdt:P31']
  const type = getEntityType(wdtP31Array)
  if (newValue) {
    validateClaimValueSync(property, newValue, type)
  }

  if (property !== 'wdt:P31') return
  // Let wikibase-edit reject the update
  if (!isNonEmptyArray(wdtP31Array) || !wdtP31Array.includes(oldValue)) return

  validateP31Update({ wdtP31Array: entity.claims['wdt:P31'], oldValue, newValue })
}

export function validateP31Update ({ wdtP31Array, oldValue, newValue }) {
  let postUpdateWdtP31Array = cloneDeep(wdtP31Array)
  const typeBeforeUpdate = getEntityType(wdtP31Array)
  const valueIndex = wdtP31Array.indexOf(oldValue)
  if (newValue) {
    postUpdateWdtP31Array[valueIndex] = newValue
  } else {
    postUpdateWdtP31Array = without(postUpdateWdtP31Array, oldValue)
  }
  const typeAfterUpdate = getEntityType(postUpdateWdtP31Array)
  if (postUpdateWdtP31Array.length === 0) {
    throw error_.new("wdt:P31 array can't be empty", 400, { wdtP31Array, postUpdateWdtP31Array, oldValue, newValue })
  }
  if (typeBeforeUpdate !== typeAfterUpdate) {
    throw error_.new("This edit would change the entity's type", 400, { wdtP31Array, postUpdateWdtP31Array, typeBeforeUpdate, typeAfterUpdate })
  }
}
