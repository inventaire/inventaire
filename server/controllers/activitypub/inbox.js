const inboxActivityTypes = {
  Follow: require('./follow'),
  Undo: require('./undo'),
}

const sanitization = {
  id: {
    // override couchUuid validation
    generic: 'string'
  },
  type: {
    allowlist: Object.keys(inboxActivityTypes)
  },
  '@context': {
    allowlist: [ 'https://www.w3.org/ns/activitystreams' ]
  },
  actor: {},
  object: {
    generic: 'stringOrObject'
  }
}

const controller = async params => {
  return inboxActivityTypes[params.type](params)
}

module.exports = {
  sanitization,
  controller
}
