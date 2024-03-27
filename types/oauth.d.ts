import type { allScopes } from '#controllers/auth/lib/oauth/scopes'
import type { ISODate, StringifiedHashedSecretData, Url } from '#types/common'
import type { CouchDoc, CouchUuid } from '#types/couchdb'
import type { UserId } from '#types/user'

export type OAuthAuthorizationId = CouchUuid
export type OAuthClientId = CouchUuid
export type OAuthTokenId = CouchUuid

export type OAuthScope = typeof allScopes[number]
export type OAuthGrants = 'authorization_code'

export interface OAuthClient extends CouchDoc {
  _id: OAuthClientId
  id?: OAuthClientId
  redirectUris: Url[]
  grants: OAuthGrants
  scope: OAuthScope[]
  name: string
  description: string
  secret: StringifiedHashedSecretData
}

export interface OAuthAuthorization extends CouchDoc {
  _id: OAuthAuthorizationId
  expiresAt: ISODate | Date
  redirectUri: Url
  // OAuthScopes joined in a string
  scope: string
  userId: UserId
  clientId: OAuthClientId
}

export interface OAuthToken extends CouchDoc {
  _id: OAuthTokenId
  authorizationCode: string /* [0-9a-f]{50} */
  accessTokenExpiresAt: ISODate | Date
  refreshToken: string /* [0-9a-f]{50} */
  refreshTokenExpiresAt: ISODate | Date
  scope: OAuthScope[]
  userId: UserId
  clientId: OAuthClientId
}
