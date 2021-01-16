// This module implements a model object as expected by express-oauth-server and oauth2-server
// See specification https://oauth2-server.readthedocs.io/en/latest/model/overview.html

const clientsDb = {
  c4252a3321c1234b0bf82430dd2f7f69: {
    id: 'c4252a3321c1234b0bf82430dd2f7f69',
    redirectUris: [
      'http://localhost:8888/wiki/Special:OAuth2Client/callback',
    ],
    grants: [ 'authorization_code' ],
    scope: [ 'profile' ]
  }
}
const usersDb = {}
const authorizationCodesDb = {}
const tokensDb = {}

module.exports = {
  // Spec https://oauth2-server.readthedocs.io/en/latest/model/spec.html#getaccesstoken-accesstoken-callback
  getAccessToken: async bearerToken => {
    if (!bearerToken) return false
    const token = tokensDb[bearerToken]
    if (!token) return false
    const client = clientsDb[token.client]
    const user = usersDb[token.user]
    return Object.assign({}, token, { client, user })
  },

  // Spec https://oauth2-server.readthedocs.io/en/latest/model/spec.html#getclient-clientid-clientsecret-callback
  getClient: async (clientId, clientSecret) => {
    const client = clientsDb[clientId]
    return client
  },

  // Spec https://oauth2-server.readthedocs.io/en/latest/model/spec.html#saveauthorizationcode-code-client-user-callback
  saveAuthorizationCode: async (code, client, user) => {
    const { authorizationCode } = code
    authorizationCodesDb[authorizationCode] = code
    authorizationCodesDb[authorizationCode].user = user._id
    authorizationCodesDb[authorizationCode].client = client.id

    // Temp hack to keep user doc at hand
    usersDb[user._id] = user

    return Object.assign({}, code, { client, user })
  },

  // Spec https://oauth2-server.readthedocs.io/en/latest/model/spec.html#getauthorizationcode-authorizationcode-callback
  getAuthorizationCode: authorizationCode => {
    const foundAuthorizationCode = authorizationCodesDb[authorizationCode]
    const client = clientsDb[foundAuthorizationCode.client]
    const user = usersDb[foundAuthorizationCode.user]
    return Object.assign({}, foundAuthorizationCode, { client, user })
  },

  // Spec https://oauth2-server.readthedocs.io/en/latest/model/spec.html#savetoken-token-client-user-callback
  saveToken: (token, client, user) => {
    tokensDb[token.accessToken] = token
    tokensDb[token.accessToken].user = user._id
    tokensDb[token.accessToken].client = client.id
    return Object.assign({}, token, { client, user })
  },

  // Spec https://oauth2-server.readthedocs.io/en/latest/model/spec.html#revokeauthorizationcode-code-callback
  revokeAuthorizationCode: code => {
    const { authorizationCode } = code
    const foundAuthorizationCode = authorizationCodesDb[authorizationCode]
    if (foundAuthorizationCode != null) {
      delete authorizationCodesDb[authorizationCode]
      return true
    } else {
      return false
    }
  },

  // Spec https://oauth2-server.readthedocs.io/en/latest/model/spec.html#validatescope-user-client-scope-callback
  validateScope: (user, client, scope) => {
    if (client.scope.length === 1 && client.scope[0] === scope) return scope
    else return false
  }
}
