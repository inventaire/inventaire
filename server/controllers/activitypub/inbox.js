const { verifySignature } = require('./lib/security')

const inboxActivityTypes = {
  Follow: require('./follow'),
  Undo: require('./undo'),
}

const ignoredTypes = [
  'Delete'
]

const sanitization = {
  id: {
    // override couchUuid validation
    generic: 'string'
  },
  type: {
    allowlist: Object.keys(inboxActivityTypes).concat(ignoredTypes)
  },
  '@context': {
    allowlist: [ 'https://www.w3.org/ns/activitystreams' ]
  },
  actor: {},
  object: {
    generic: 'stringOrObject'
  }
}

const controller = async (params, req) => {
  const { type } = params
  if (ignoredTypes.includes(type)) {
    return { ok: true }
  } else {
    await verifySignature(req)
    return inboxActivityTypes[type](params)
  }
}

module.exports = {
  sanitization,
  controller
}
