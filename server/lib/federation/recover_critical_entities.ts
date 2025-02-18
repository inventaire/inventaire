import { map, uniq } from 'lodash-es'
import type { GetEntitiesByUrisResponse } from '#controllers/entities/by_uris_get'
import type { Redirects } from '#controllers/entities/lib/get_entities_by_uris'
import { isRemovedPlaceholder } from '#controllers/entities/lib/placeholders'
import { getItemsByEntities } from '#controllers/items/lib/items'
import { getElementsByEntities } from '#controllers/listings/lib/elements'
import { hardCodedUsers } from '#db/couchdb/hard_coded_documents'
import { signedFederatedRequestAsUser } from '#lib/federation/signed_federated_request'
import { objectEntries } from '#lib/utils/base'
import type { ListingElement } from '#types/element'
import type { EntityUri } from '#types/entity'
import type { Item } from '#types/item'

const { hook: hookUser } = hardCodedUsers

export async function checkIfCriticalEntitiesWereRemoved (res: GetEntitiesByUrisResponse) {
  const uris = getUrisToCheck(res)
  if (uris.length === 0) return
  const [ items, elements ] = await Promise.all([
    getItemsByEntities(uris),
    getElementsByEntities(uris),
  ])
  const criticalUris = getCriticalUris(items, elements, res.redirects)
  await recoverCriticalEntities(criticalUris)
}

function getUrisToCheck (res: GetEntitiesByUrisResponse) {
  const { entities, redirects } = res
  const urisToCheck: EntityUri[] = []
  for (const [ uri, entity ] of objectEntries(entities)) {
    // @ts-expect-error
    if (isRemovedPlaceholder(entity)) urisToCheck.push(uri)
  }
  for (const [ from, to ] of objectEntries(redirects)) {
    if (urisToCheck.includes(to)) urisToCheck.push(from)
  }
  return urisToCheck
}

function getCriticalUris (items: Item[], elements: ListingElement[], redirects: Redirects) {
  const criticalUris = [
    ...map(items, 'entity'),
    ...map(elements, 'uri'),
  ]
  // Request the recovery of the redirection target rather than the redirected uri
  .map(uri => redirects[uri] ? redirects[uri] : uri)
  return uniq(criticalUris)
}

async function recoverCriticalEntities (uris: EntityUri[]) {
  await signedFederatedRequestAsUser(hookUser, 'post', '/api/entities?action=recover', { uris })
}
