const error_ = require('lib/error/error')
const qs = require('querystring')
const user_ = require('controllers/user/lib/user')
const { createActivity } = require('controllers/activitypub/lib/activities')

const sanitization = {
  id: {
    // override couchUuid validation
    generic: 'string'
  },
  type: {
    allowlist: [ 'Follow' ]
  },
  '@context': {
    allowlist: [
      'https://www.w3.org/ns/activitystreams',
      'https://w3id.org/security/v1'
    ]
  },
  actor: {},
  object: {}
}

const controller = async params => {
  const { object } = params
  const { name: requestedObjectName } = qs.parse(object)
  const user = await user_.findOneByUsername(requestedObjectName)
  // TODO: return 403 instead
  if (!user.fediversable) throw error_.notFound({ username: requestedObjectName })
  return createActivity(params)
  .then(createAcceptResponse)
}

const createAcceptResponse = res => {
  const { actor, object } = res
  return {
    id: res.externalId,
    type: 'Accept',
    actor,
    object
  }
}

module.exports = {
  sanitization,
  controller,
  track: [ 'activitypub', 'inbox' ]
}
