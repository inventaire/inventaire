import _ from 'builders/utils'
import { verifySignature } from './lib/security'
import error_ from 'lib/error/error'
import Follow from './follow'
import Undo from './undo'

const inboxActivityTypes = {
  Create: null,
  Delete: null,
  Follow,
  Undo,
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
    allowlist: [
      'https://www.w3.org/ns/activitystreams',
      'https://w3id.org/security/v1',
    ]
  },
  actor: {},
  object: {
    generic: 'stringOrObject'
  },

  cc: { generic: 'ignore' },
  context: { generic: 'ignore' },
  conversation: { generic: 'ignore' },
  directMessage: { generic: 'ignore' },
  hash: { generic: 'ignore' },
  inReplyTo: { generic: 'ignore' },
  instrument: { generic: 'ignore' },
  name: { generic: 'ignore' },
  published: { generic: 'ignore' },
  signature: { generic: 'ignore' },
  signed_data: { generic: 'ignore' },
  signer: { generic: 'ignore' },
  to: { generic: 'ignore' },
  url: { generic: 'ignore' },
}

const controller = async (params, req) => {
  const { type } = params
  if (inboxActivityTypes[type] != null) {
    await verifySignature(req)
    return inboxActivityTypes[type](params)
  } else {
    const message = 'unsupported activity type'
    const err = error_.new(message, 400, params)
    err.mute = true
    _.warn(`${message}: ${type}`)
    throw err
  }
}

export default {
  sanitization,
  controller
}
