import type { allScopes } from '#controllers/auth/lib/oauth/scopes'
import type { ISODate, StringifiedHashedSecretData, Url } from '#types/common'
import type { CouchDoc, CouchUuid } from '#types/couchdb'
import type { UserId } from '#types/user'
import type { OverrideProperties } from 'type-fest'

export type OAuthClientId = CouchUuid

/* [0-9a-f]{64} */
export type OAuthAuthorizationCode = string

/* [0-9a-f]{40} */
export type OAuthToken = string

export type OAuthScope = typeof allScopes[number]
export type OAuthGrants = 'authorization_code'

export interface OAuthClientCommons {
  redirectUris: Url[]
  grants: OAuthGrants
  scope: OAuthScope[]
  name: string
  description: string
  secret: StringifiedHashedSecretData
}

export interface OAuthClient extends CouchDoc, OAuthClientCommons {}

export interface SerializedOAuthClient extends OAuthClientCommons {
  id: OAuthClientId
}

export interface OAuthAuthorization extends CouchDoc {
  _id: OAuthAuthorizationCode
  expiresAt: ISODate
  redirectUri: Url
  scope: OAuthScope[]
  userId: UserId
  clientId: OAuthClientId
}

export interface SerializedOAuthAuthorization extends OverrideProperties<OAuthAuthorization, {
  expiresAt: Date
}> {
  authorizationCode: OAuthAuthorizationCode
}

export interface OAuthTokenDoc extends CouchDoc {
  _id: OAuthToken
  authorizationCode: OAuthAuthorizationCode
  accessToken: string
  accessTokenExpiresAt: ISODate
  refreshToken: string /* [0-9a-f]{50} */
  refreshTokenExpiresAt: ISODate
  scope: OAuthScope[]
  userId: UserId
  clientId: OAuthClientId
}

export interface SerializedOAuthTokenDoc extends OverrideProperties<OAuthTokenDoc, {
  accessTokenExpiresAt: Date
  refreshTokenExpiresAt: Date
}> {
  client?: OAuthClient
}

export interface BearerToken {
  access_token: string
  token_type: 'Bearer'
  expires_in: number
  refresh_token: string
  scope: OAuthScope[]
}
