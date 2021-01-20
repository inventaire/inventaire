// This module implements a model object as expected by express-oauth-server and oauth2-server
// See specification https://oauth2-server.readthedocs.io/en/latest/model/overview.html

const __ = require('config').universalPath
const user_ = __.require('controllers', 'user/lib/user')
const error_ = __.require('lib', 'error/error')
const assert_ = __.require('utils', 'assert_types')
const { catchNotFound } = error_

const clients_ = require('./clients')
const authorizations_ = require('./authorizations')
const tokens_ = require('./tokens')
const InvalidClientError = require('oauth2-server/lib/errors/invalid-client-error')

module.exports = {
  // Spec https://oauth2-server.readthedocs.io/en/latest/model/spec.html#getaccesstoken-accesstoken-callback
  getAccessToken: async bearerToken => {
    if (!bearerToken) return false
    const token = await tokens_.byId(bearerToken).catch(catchNotFound)
    if (!token) return false
    const client = await clients_.byId(token.clientId)
    const user = await user_.byId(token.userId)
    return Object.assign(token, { client, user })
  },

  // Spec https://oauth2-server.readthedocs.io/en/latest/model/spec.html#getclient-clientid-clientsecret-callback
  getClient: async (clientId, clientSecret) => {
    return clients_.byId(clientId)
    .then(client => {
      // Secret validation is done only while trying to optain a token, not when generating an authorization
      if (clientSecret === null) return client
      // TODO: store the client secret as we would store a password: hashed and slow
      if (client.secret === clientSecret) return client
      // Without a valid client, oauth2-server@3.0.0 throws 'client is invalid', which is quite unspecific
      else throw new InvalidClientError('Invalid client: client credentials are invalid')
    })
    .catch(err => {
      if (err.statusCode === 404) throw error_.new('unknown client', 400, { clientId })
      else throw err
    })
  },

  // Spec https://oauth2-server.readthedocs.io/en/latest/model/spec.html#saveauthorizationcode-code-client-user-callback
  saveAuthorizationCode: async (code, client, user) => {
    await authorizations_.save(code, user._id, client.id)
    return Object.assign(code, { client, user })
  },

  // Spec https://oauth2-server.readthedocs.io/en/latest/model/spec.html#getauthorizationcode-authorizationcode-callback
  getAuthorizationCode: async authorizationCode => {
    const foundAuthorizationCode = await authorizations_.byId(authorizationCode).catch(catchNotFound)
    if (!foundAuthorizationCode) return
    const client = await clients_.byId(foundAuthorizationCode.clientId)
    const user = await user_.byId(foundAuthorizationCode.userId)
    return Object.assign(foundAuthorizationCode, { client, user })
  },

  // Spec https://oauth2-server.readthedocs.io/en/latest/model/spec.html#savetoken-token-client-user-callback
  saveToken: async (token, client, user) => {
    await tokens_.save(token, user._id, client.id)
    return Object.assign(token, { client, user })
  },

  // Spec https://oauth2-server.readthedocs.io/en/latest/model/spec.html#revokeauthorizationcode-code-callback
  revokeAuthorizationCode: async code => {
    const { authorizationCode } = code
    const foundAuthorizationCode = await authorizations_.byId(authorizationCode).catch(catchNotFound)
    if (foundAuthorizationCode != null) {
      await authorizations_.delete(foundAuthorizationCode)
      return true
    } else {
      return false
    }
  },

  // Spec https://oauth2-server.readthedocs.io/en/latest/model/spec.html#validatescope-user-client-scope-callback
  validateScope: async (user, client, scope) => {
    if (typeof scope === 'string') scope = getScopeArray(scope)
    assert_.array(client.scope)
    if (scope.every(scopePart => client.scope.includes(scopePart))) {
      return scope
    } else {
      return false
    }
  },

  // Spec https://oauth2-server.readthedocs.io/en/latest/model/spec.html#verifyscope-accesstoken-scope-callback
  verifyScope: async (token, acceptedScopes) => {
    if (typeof token.scope === 'string') token.scope = getScopeArray(token.scope)
    assert_.array(acceptedScopes)
    token.matchingScopes = token.scope.filter(scope => acceptedScopes.includes(scope))
    return token.matchingScopes.length > 0
  }
}

const scopeSeparators = /[+\s]/
const getScopeArray = scopeStr => scopeStr.split(scopeSeparators)
