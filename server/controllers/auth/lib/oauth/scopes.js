const scopeByMethodAndRoute = {
  get: {
    '/api/user': [ 'username', 'stable-username', 'email' ],
  },
}

export default {
  getAcceptedScopes: ({ method, url }) => {
    method = method.toLowerCase()
    if (scopeByMethodAndRoute[method] != null) {
      return scopeByMethodAndRoute[method][url]
    }
  },
  allScopes: Object.values(scopeByMethodAndRoute).map(Object.values).flat(2),
}
