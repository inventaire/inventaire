const OAuthServer = require('express-oauth-server')

const oauthServer = new OAuthServer({
  useErrorHandler: true,
  model: require('./lib/oauth/model')
})

const authorize = oauthServer.authorize({
  authenticateHandler: {
    handle: (req, res) => {
      // TODO: handle when user isn't logged in
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
    get: authorize
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
  authenticate: oauthServer.authenticate()
}
