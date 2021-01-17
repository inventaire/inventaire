// This module implements a model object as expected by express-oauth-server and oauth2-server
// See specification https://oauth2-server.readthedocs.io/en/latest/model/overview.html

const __ = require('config').universalPath
const user_ = __.require('controllers', 'user/lib/user')
const error_ = __.require('lib', 'error/error')
const assert_ = __.require('utils', 'assert_types')

const clients_ = require('./clients')
const authorizations_ = require('./authorizations')
const tokens_ = require('./tokens')

module.exports = {
  // Spec https://oauth2-server.readthedocs.io/en/latest/model/spec.html#getaccesstoken-accesstoken-callback
  getAccessToken: async bearerToken => {
    if (!bearerToken) return false
    const token = await tokens_.byId(bearerToken)
    if (!token) return false
    const client = await clients_.byId(token.clientId)
    const user = await user_.byId(token.userId)
    return Object.assign(token, { client, user })
  },

  // Spec https://oauth2-server.readthedocs.io/en/latest/model/spec.html#getclient-clientid-clientsecret-callback
  getClient: async (clientId, clientSecret) => {
    return clients_.byId(clientId)
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
    const foundAuthorizationCode = await authorizations_.byId(authorizationCode)
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
    const foundAuthorizationCode = await authorizations_.byId(authorizationCode)
    if (foundAuthorizationCode != null) {
      await authorizations_.delete(foundAuthorizationCode)
      return true
    } else {
      return false
    }
  },

  // Spec https://oauth2-server.readthedocs.io/en/latest/model/spec.html#validatescope-user-client-scope-callback
  validateScope: async (user, client, scope) => {
    assert_.array(client.scope)
    if (client.scope.length === 1 && client.scope[0] === scope) return scope
    else return false
  }
}
