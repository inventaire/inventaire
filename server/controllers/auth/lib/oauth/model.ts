// This module implements a model object as expected by express-oauth-server and oauth2-server
// See specification https://node-oauthoauth2-server.readthedocs.io/en/latest/model/overview.html

import { InvalidClientError, type ServerOptions } from '@node-oauth/oauth2-server'
import { difference } from 'lodash-es'
import { getAuthorizationById, deleteAuthorization, saveAuthorization } from '#controllers/auth/lib/oauth/authorizations'
import { getOauthClientById } from '#controllers/auth/lib/oauth/clients'
import { getOauthTokenbyId, saveOauthToken } from '#controllers/auth/lib/oauth/tokens'
import { getUserById } from '#controllers/user/lib/user'
import { verifyPassword } from '#lib/crypto'
import { newError, catchNotFound } from '#lib/error/error'
import { assertArray } from '#lib/utils/assert_types'
import { arrayIncludes } from '#lib/utils/base'
import { warn } from '#lib/utils/logs'
import type { OAuthAuthorizationCode, OAuthClientId, OAuthToken, SerializedOAuthClient } from '#types/oauth'
import type { User } from '#types/user'
import type OAuth2Server from '@node-oauth/oauth2-server'

export const oauthServerModel = {
  // Spec https://node-oauthoauth2-server.readthedocs.io/en/latest/model/spec.html#getaccesstoken-accesstoken
  getAccessToken: async (bearerToken: OAuthToken) => {
    if (!bearerToken) return false
    const token = await getOauthTokenbyId(bearerToken).catch(catchNotFound)
    if (!token) return false
    const client = await getOauthClientById(token.clientId)
    const user = await getUserById(token.userId)
    return Object.assign(token, { client, user })
  },

  // Spec https://node-oauthoauth2-server.readthedocs.io/en/latest/model/spec.html#getclient-clientid-clientsecret
  getClient: async (clientId: OAuthClientId, clientSecret: string) => {
    let client
    try {
      client = await getOauthClientById(clientId)
    } catch (err) {
      if (err.statusCode === 404) throw newError('unknown client', 400, { clientId })
      else throw err
    }

    // Secret validation is done only while trying to optain a token, not when generating an authorization
    if (clientSecret === null) return client

    const isValidSecret = await verifyPassword(client.secret, clientSecret)
    if (isValidSecret) {
      return client
    } else {
      // Without a valid client, oauth2-server@3.0.0 throws 'client is invalid', which is quite unspecific
      throw new InvalidClientError('Invalid client: client credentials are invalid')
    }
  },

  // Spec https://node-oauthoauth2-server.readthedocs.io/en/latest/model/spec.html#saveauthorizationcode-code-client-user
  saveAuthorizationCode: async (code: OAuth2Server.AuthorizationCode, client: SerializedOAuthClient, user: User) => {
    await saveAuthorization(code, user._id, client.id)
    return Object.assign(code, { client, user })
  },

  // Spec https://node-oauthoauth2-server.readthedocs.io/en/latest/model/spec.html#getauthorizationcode-authorizationcode
  getAuthorizationCode: async (authorizationCode: OAuthAuthorizationCode) => {
    const foundAuthorizationCode = await getAuthorizationById(authorizationCode).catch(catchNotFound)
    if (!foundAuthorizationCode) return
    const client = await getOauthClientById(foundAuthorizationCode.clientId)
    const user = await getUserById(foundAuthorizationCode.userId)
    return Object.assign(foundAuthorizationCode, { client, user })
  },

  // Spec https://node-oauthoauth2-server.readthedocs.io/en/latest/model/spec.html#savetoken-token-client-user
  saveToken: async (token: OAuth2Server.Token, client: SerializedOAuthClient, user: User) => {
    await saveOauthToken(token, user._id, client.id)
    return Object.assign(token, { client, user })
  },

  // Spec https://node-oauthoauth2-server.readthedocs.io/en/latest/model/spec.html#revokeauthorizationcode-code
  revokeAuthorizationCode: async (code: OAuth2Server.AuthorizationCode) => {
    const { authorizationCode } = code
    const foundAuthorizationCode = await getAuthorizationById(authorizationCode).catch(catchNotFound)
    if (foundAuthorizationCode) {
      await deleteAuthorization(foundAuthorizationCode)
      return true
    } else {
      return false
    }
  },

  // Spec https://node-oauthoauth2-server.readthedocs.io/en/latest/model/spec.html#validatescope-user-client-scope
  validateScope: async (user, client: SerializedOAuthClient, scope: string[]) => {
    if (typeof scope === 'string') scope = getScopeArray(scope)
    else scope = scope.flatMap(getScopeArray)
    assertArray(client.scope)
    const notClientScopes = difference(scope, client.scope)
    if (notClientScopes.length > 0) {
      warn({ requestedScopes: scope, clientScopes: client.scope, notClientScopes }, 'oauth scope validation failed')
      return false
    } else {
      return scope
    }
  },

  // Spec https://node-oauthoauth2-server.readthedocs.io/en/latest/model/spec.html#verifyscope-accesstoken-scope
  verifyScope: async (token: OAuth2Server.Token, acceptedScopes: string[]) => {
    if (typeof token.scope === 'string') token.scope = getScopeArray(token.scope)
    assertArray(acceptedScopes)
    token.matchingScopes = token.scope.filter(scope => arrayIncludes(acceptedScopes, scope))
    return token.matchingScopes.length > 0
  },
} satisfies ServerOptions['model']

const scopeSeparators = /[\s+]/
const getScopeArray = (scopeStr: string) => scopeStr.split(scopeSeparators)
