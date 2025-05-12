import { makeActorKeyUrl } from '#controllers/activitypub/lib/get_actor'
import { signRequest } from '#controllers/activitypub/lib/security'
import { getSharedKeyPair } from '#controllers/activitypub/lib/shared_key_pair'
import { isRelativeUrl } from '#lib/boolean_validations'
import { federatedRequest } from '#lib/federation/federated_requests'
import { instanceActorName } from '#lib/federation/instance'
import { remoteUserHeader } from '#lib/federation/remote_user'
import { remoteEntitiesOrigin } from '#server/config'
import type { AbsoluteUrl, HttpHeaders, Url, HttpMethod } from '#types/common'
import type { AuthentifiedReq } from '#types/server'
import type { SpecialUser } from '#types/user'

type FedReq = AuthentifiedReq | { user: SpecialUser }

export async function signedFederatedRequest (req: FedReq, method: HttpMethod, url: Url, body: unknown, extraHeaders?: HttpHeaders) {
  const headers = await getSignedFederatedRequestHeaders(req, method, url, body, extraHeaders)
  return federatedRequest(method, url, { headers, body })
}

export async function getSignedFederatedRequestHeaders (req: FedReq, method: HttpMethod, url: Url, body: unknown, extraHeaders?: HttpHeaders) {
  const remoteUrl = isRelativeUrl(url) ? `${remoteEntitiesOrigin}${url}` as AbsoluteUrl : url
  const { anonymizableId: userAnonymizableId } = req.user
  const { privateKey, publicKeyHash } = await getSharedKeyPair()
  return signRequest({
    url: remoteUrl,
    method,
    // Using the instance actor rather than a keyId customize per user
    // to maximize key cache hits
    keyId: makeActorKeyUrl(instanceActorName, publicKeyHash),
    privateKey,
    body,
    headers: {
      [remoteUserHeader]: userAnonymizableId,
      ...extraHeaders,
    },
  })
}

export function signedFederatedRequestAsUser (user: SpecialUser, method: HttpMethod, url: Url, body: unknown) {
  return signedFederatedRequest({ user }, method, url, body)
}
