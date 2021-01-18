const __ = require('config').universalPath
const error_ = __.require('lib', 'error/error')
const OAuthServer = require('express-oauth-server')

const oauthServer = new OAuthServer({
  useErrorHandler: true,
  model: require('./lib/oauth/model')
})

const authorize = oauthServer.authorize({
  authenticateHandler: {
    handle: (req, res) => {
      return req.user
    }
  }
})

// See https://oauth2-server.readthedocs.io/en/latest/api/oauth2-server.html
module.exports = {
  // Step 1: the user authorizes a client to get tokens on its behalf, for certain scopes
  // by doing a GET on the authorize endpoint
  // Implements https://aaronparecki.com/oauth-2-simplified/#web-server-apps "Authorization"
  authorize: {
    get: (req, res, next) => {
      if (req.user == null) return error_.unauthorizedApiAccess(req, res)

      const { scope } = req.query
      if (!scope) return error_.bundleMissingQuery(req, res, 'scope')

      authorize(req, res, next)
    }
  },

  // Step 2: the client requests a token
  // by doing a POST on the token endpoint
  // Implements https://aaronparecki.com/oauth-2-simplified/#web-server-apps "Getting an Access Token"
  token: {
    post: oauthServer.token()
  },

  // Step 3: the client uses a token to access resources within the token authorized scopes
  // That token is used by the authenticate middleware to accept or decline the access on any endpoint
  // Implements https://aaronparecki.com/oauth-2-simplified/#making-authenticated-requests
  authenticate: (req, res, next) => {
    const scope = getAcceptedScopes(req)
    if (scope != null) oauthServer.authenticate({ scope })(req, res, next)
    else return error_.bundle(req, res, 'this resource can not be accessed with an OAuth bearer token', 403)
  }
}

const getAcceptedScopes = ({ method, url }) => {
  method = method.toLowerCase()
  if (scopeByMethodAndRoute[method] != null) {
    return scopeByMethodAndRoute[method][url]
  }
}

const scopeByMethodAndRoute = {
  get: {
    '/api/user': [ 'profile' ]
  }
}
