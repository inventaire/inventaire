module.exports = {
  getAcceptedScopes: ({ method, url }) => {
    method = method.toLowerCase()
    if (scopeByMethodAndRoute[method] != null) {
      return scopeByMethodAndRoute[method][url]
    }
  }
}

const scopeByMethodAndRoute = {
  get: {
    '/api/user': [ 'username', 'stable-username', 'email' ]
  }
}
