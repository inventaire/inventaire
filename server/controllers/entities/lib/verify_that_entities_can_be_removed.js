import { getInvEntitiesByClaimsValue } from '#controllers/entities/lib/entities'
import { getItemsByEntity } from '#controllers/items/lib/items'
import { error_ } from '#lib/error/error'
import getEntitiesByUris from './get_entities_by_uris.js'
import { prefixifyInv } from './prefix.js'

const criticalClaimProperties = [
  // No edition should end up without an associated work because of a removed work
  'wdt:P629',
]

export default uris => {
  return Promise.all([
    entitiesRelationsChecks(uris),
    entitiesItemsChecks(uris),
  ])
}

const entitiesRelationsChecks = uris => Promise.all(uris.map(entityIsntUsedMuch))

const entityIsntUsedMuch = async uri => {
  const claims = await getInvEntitiesByClaimsValue(uri)

  claims.forEach(claim => { claim.entity = prefixifyInv(claim.entity) })

  // Tolerating 1 claim: typically when a junk author entity is linked via a wdt:P50 claim
  // to a work, the author can be deleted, which will also remove the claim on the work
  if (claims.length > 1) {
    throw error_.new('this entity is used has value in too many claims to be removed', 403, { uri, claims })
  }

  for (const claim of claims) {
    if (criticalClaimProperties.includes(claim.property)) {
      throw error_.new('this entity is used in a critical claim', 403, { uri, claim })
    }
  }
}

const entitiesItemsChecks = async uris => {
  const allUris = await getAllUris(uris)
  return Promise.all(allUris.map(entityIsntUsedByAnyItem))
}

const getAllUris = async uris => {
  const { redirects } = await getEntitiesByUris({ uris })
  if (redirects == null) return uris
  const missingCanonicalUris = Object.values(redirects)
  return uris.concat(missingCanonicalUris)
}

const entityIsntUsedByAnyItem = async uri => {
  const items = await getItemsByEntity(uri)
  if (items.length > 0) {
    throw error_.new("entities that are used by an item can't be removed", 403, { uri })
  }
}
