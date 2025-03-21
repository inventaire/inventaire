import { omit } from 'lodash-es'
import { dbFactory } from '#db/couchdb/base'
import { assertObject, assertString } from '#lib/utils/assert_types'
import type { OAuthAuthorization, OAuthAuthorizationCode, OAuthClientId, SerializedOAuthAuthorization } from '#types/oauth'
import type { UserId } from '#types/user'
import type OAuth2Server from '@node-oauth/oauth2-server'

const db = await dbFactory('oauth_authorizations')

export async function getAuthorizationById (id: OAuthAuthorizationCode) {
  const doc = await db.get<OAuthAuthorization>(id)
  return {
    ...doc,
    authorizationCode: doc._id,
    expiresAt: new Date(doc.expiresAt),
  } as SerializedOAuthAuthorization
}

export async function saveAuthorization (code: OAuth2Server.AuthorizationCode, userId: UserId, clientId: OAuthClientId) {
  assertObject(code)
  assertString(userId)
  assertString(clientId)

  const { authorizationCode } = code
  const doc = omit(code, [ 'authorizationCode' ])
  doc._id = authorizationCode
  doc.userId = userId
  doc.clientId = clientId
  await db.put(doc)
}

export async function deleteAuthorization (authorization: SerializedOAuthAuthorization) {
  const { _id, _rev } = authorization
  return db.delete(_id, _rev)
}
