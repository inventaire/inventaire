const scopeByMethodAndRoute = {
  get: {
    '/api/user': [ 'username', 'stable-username', 'email' ],
  },
}

export function getAcceptedScopes ({ method, url }) {
  method = method.toLowerCase()
  if (scopeByMethodAndRoute[method] != null) {
    return scopeByMethodAndRoute[method][url]
  }
}

export const allScopes = [ 'username', 'stable-username', 'email' ] as const
