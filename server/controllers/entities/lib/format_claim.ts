import { isClaimObject } from '#controllers/entities/lib/inv_claims_utils'
import { propertiesValuesConstraints } from '#controllers/entities/lib/properties/properties_values_constraints'
import type { InvClaim, PropertyUri } from '#server/types/entity'

export function formatClaim (property: PropertyUri, claim: InvClaim) {
  const { format } = propertiesValuesConstraints[property]
  if (!format) return claim
  if (isClaimObject(claim)) {
    return Object.assign({}, claim, { value: format(claim.value) })
  } else {
    return format(claim)
  }
}
