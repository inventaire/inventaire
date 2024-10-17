import { localProperties } from '#controllers/entities/lib/properties/properties_values_constraints'
import { objectEntries } from '#lib/utils/base'
import type { Claims, InvClaim, InvClaimObject, InvClaimValue, InvPropertyClaims, ClaimValueByProperty, InvSnakValue, TypedPropertyUri, InvEntity, SimplifiedClaims, ExpandedClaims } from '#types/entity'

export function isClaimObject (claim: InvClaim): claim is InvClaimObject {
  return typeof claim === 'object' && claim !== null && 'value' in claim
}

export function getClaimValue (claim: InvClaim) {
  if (isClaimObject(claim)) {
    return claim.value
  } else {
    return claim
  }
}

export function getTypedClaimValue <C extends InvClaim, P extends keyof ClaimValueByProperty> (claim: C, property: P) {
  if (isClaimObject(claim)) {
    return claim.value as ClaimValueByProperty[typeof property]
  } else if (claim != null) {
    return (claim as InvSnakValue) as ClaimValueByProperty[typeof property]
  }
}

export function setClaimValue (claim: InvClaim, value: InvClaimValue) {
  if (isClaimObject(claim)) {
    return { ...claim, value }
  } else {
    return value
  }
}

export function getClaimIndex (claimsArray: InvPropertyClaims, claim: InvClaim) {
  return claimsArray.map(getClaimValue).indexOf(getClaimValue(claim))
}

export function findClaimByValue (claimsArray: InvPropertyClaims, claim: InvClaim) {
  return claimsArray.find(c => getClaimValue(c) === getClaimValue(claim))
}

// The option is named 'keepReferences' rather than 'includeReferences' to make
// the function options compatible with wikibase-sdk simplifyClaims options
export function simplifyInvClaims (claims: Claims, { keepReferences = false } = {}) {
  const simplifiedClaims = {}
  for (const [ property, propertyClaims ] of objectEntries(claims)) {
    // For some yet unidentified reason, some empty claim arrays keep sneaking in the local entities database
    if (propertyClaims.length > 0) {
      if (keepReferences) {
        simplifiedClaims[property] = propertyClaims.map(getClaimObjectFromClaim)
      } else {
        simplifiedClaims[property] = propertyClaims.map(getClaimValue)
      }
    }
  }
  return simplifiedClaims
}

export function expandInvClaims (claims: Claims) {
  return simplifyInvClaims(claims, { keepReferences: true })
}

export function getPropertyClaimsValues <C extends Claims, P extends TypedPropertyUri> (claims: C, property: P) {
  if (claims?.[property]) {
    return claims[property].map(claim => getTypedClaimValue(claim, property))
  }
}

export function getFirstClaimValue <C extends (Claims | SimplifiedClaims | ExpandedClaims), P extends TypedPropertyUri> (claims: C, property: P) {
  if (claims?.[property]?.[0]) {
    const firstClaim = claims[property][0] as ClaimValueByProperty[P]
    return getTypedClaimValue(firstClaim, property)
  }
}

export function getClaimObjectFromClaim (claim: InvClaim) {
  if (isClaimObject(claim)) {
    return claim
  } else {
    return { value: claim }
  }
}

export function hasLocalClaims (doc: InvEntity) {
  for (const property of localProperties) {
    if (doc.claims[property] != null) return true
  }
  return false
}
