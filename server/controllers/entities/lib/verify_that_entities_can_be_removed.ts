import { getInvClaimsByClaimValue } from '#controllers/entities/lib/entities'
import { getItemsByEntity } from '#controllers/items/lib/items'
import { newError } from '#lib/error/error'
import { info } from '#lib/utils/logs'
import type { InvEntityUri } from '#types/entity'
import { getEntitiesByUris } from './get_entities_by_uris.js'
import { prefixifyInv } from './prefix.js'

const criticalClaimProperties = [
  // No edition should end up without an associated work because of a removed work
  'wdt:P629',
]

export function verifyThatEntitiesCanBeRemoved (uris: InvEntityUri[]) {
  return Promise.all([
    entitiesRelationsChecks(uris),
    entitiesItemsChecks(uris),
  ])
}

const entitiesRelationsChecks = uris => Promise.all(uris.map(entityIsntUsedMuch))

async function entityIsntUsedMuch (uri) {
  const claims = await getInvClaimsByClaimValue(uri)

  claims.forEach(claim => { claim.entity = prefixifyInv(claim.entity) })

  // Tolerating 1 claim: typically when a junk author entity is linked via a wdt:P50 claim
  // to a work, the author can be deleted, which will also remove the claim on the work
  if (claims.length > 1) {
    throw newError('this entity is used has value in too many claims to be removed', 403, { uri, claims })
  }

  for (const claim of claims) {
    if (criticalClaimProperties.includes(claim.property)) {
      throw newError('this entity is used in a critical claim', 403, { uri, claim })
    }
  }
}

async function entitiesItemsChecks (uris) {
  const allUris = await getAllUris(uris)
  return Promise.all(allUris.map(entityIsntUsedByAnyItem))
}

async function getAllUris (uris) {
  const { redirects } = await getEntitiesByUris({ uris })
  if (redirects == null) return uris
  const missingCanonicalUris = Object.values(redirects)
  return uris.concat(missingCanonicalUris)
}

async function entityIsntUsedByAnyItem (uri) {
  const items = await getItemsByEntity(uri)
  if (items.length > 0) {
    info({ uri, items }, 'items blocking an entity deletion')
    throw newError("entities that are used by an item can't be removed", 403, { uri })
  }
}
