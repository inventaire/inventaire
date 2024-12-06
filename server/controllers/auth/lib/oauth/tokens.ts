import { omit } from 'lodash-es'
import { dbFactory } from '#db/couchdb/base'
import { assert_ } from '#lib/utils/assert_types'
import type { OAuthClientId, OAuthTokenDoc, OAuthToken, SerializedOAuthTokenDoc } from '#types/oauth'
import type { UserId } from '#types/user'
import type OAuth2Server from '@node-oauth/oauth2-server'

const db = await dbFactory('oauth_tokens')

export async function getOauthTokenbyId (id: OAuthToken) {
  const doc = await db.get<OAuthTokenDoc>(id)
  return {
    ...omit(doc, '_id'),
    accessToken: doc._id,
    accessTokenExpiresAt: new Date(doc.accessTokenExpiresAt),
    refreshTokenExpiresAt: new Date(doc.refreshTokenExpiresAt),
  } as SerializedOAuthTokenDoc
}

export async function saveOauthToken (token: OAuth2Server.Token, userId: UserId, clientId: OAuthClientId) {
  assert_.object(token)
  assert_.string(userId)
  assert_.string(clientId)

  const { accessToken } = token
  const doc = omit(token, [ 'accessToken' ])
  doc._id = accessToken
  doc.userId = userId
  doc.clientId = clientId
  await db.put(doc)
}
