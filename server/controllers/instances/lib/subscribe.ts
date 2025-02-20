import { hardCodedUsers } from '#db/couchdb/hard_coded_documents'
import { signedFederatedRequestAsUser } from '#lib/federation/signed_federated_request'
import type { EntityUri } from '#types/entity'
import type { EventName } from '#types/instances'

const { hook: hookUser } = hardCodedUsers

export const eventNames = [
  'revert-merge',
] as const

export async function subscribeToCrossInstanceEvent (eventName: EventName, uri: EntityUri) {
  await signedFederatedRequestAsUser(hookUser, 'post', '/api/instances?action=subscribe', { event: eventName, uris: [ uri ] })
}
