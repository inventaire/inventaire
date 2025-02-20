import { map, uniq } from 'lodash-es'
import { getInvClaimsByClaimValue } from '#controllers/entities/lib/entities'
import { getItemsByEntities } from '#controllers/items/lib/items'
import { getElementsByEntities } from '#controllers/listings/lib/elements'
import { newError } from '#lib/error/error'
import { info } from '#lib/utils/logs'
import type { EntityUri, InvEntityUri } from '#types/entity'
import { getEntitiesByUris } from './get_entities_by_uris.js'
import { prefixifyInv } from './prefix.js'

const criticalClaimProperties = [
  // No edition should end up without an associated work because of a removed work
  'wdt:P629',
]

export async function verifyThatEntitiesCanBeRemoved (uris: InvEntityUri[]) {
  const allUris = await getAllUris(uris)
  return Promise.all([
    checkEntitiesRelations(uris),
    checkEntitiesItems(allUris),
    checksEntitiesListingElements(allUris),
  ])
}

const checkEntitiesRelations = uris => Promise.all(uris.map(validateEntityIsntUsedMuch))

export async function getClaimsWithThisUri (uri: EntityUri) {
  const claims = await getInvClaimsByClaimValue(uri)
  claims.forEach(claim => { claim.entity = prefixifyInv(claim.entity) })
  return claims
}

export async function validateEntityIsntUsedMuch (uri: EntityUri) {
  // Tolerating 1 claim: typically when a junk author entity is linked via a wdt:P50 claim
  // to a work, the author can be deleted, which will also remove the claim on the work
  const claims = await getClaimsWithThisUri(uri)
  if (claims.length > 1) {
    throw newError('this entity is used has value in too many claims to be removed', 403, { uri, claims })
  }
  for (const claim of claims) {
    if (criticalClaimProperties.includes(claim.property)) {
      throw newError('this entity is used in a critical claim', 403, { uri, claim })
    }
  }
}

async function checkEntitiesItems (uris: EntityUri[]) {
  const items = await getItemsByEntities(uris)
  if (items.length > 0) {
    const itemsIds = map(items, '_id')
    const uris = uniq(map(items, 'uri'))
    info({ items: itemsIds, uris }, 'items blocking an entity deletion')
    throw newError("entities that are used by an item can't be removed", 403, { uris })
  }
}

// TODO: add test
async function checksEntitiesListingElements (uris: EntityUri[]) {
  const elements = await getElementsByEntities(uris)
  if (elements.length > 0) {
    const elementsIds = map(elements, '_id')
    const uris = uniq(map(elements, 'uri'))
    info({ elements: elementsIds, uris }, 'lists elements blocking an entity deletion')
    throw newError("entities that are used by a list element can't be removed", 403, { uris })
  }
}

async function getAllUris (uris: EntityUri[]) {
  const { redirects } = await getEntitiesByUris({ uris })
  if (redirects == null) return uris
  const missingCanonicalUris = Object.values(redirects)
  return uris.concat(missingCanonicalUris)
}
