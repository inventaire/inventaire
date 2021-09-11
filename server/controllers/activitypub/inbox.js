const error_ = require('lib/error/error')
const qs = require('querystring')
const user_ = require('controllers/user/lib/user')
const { createActivity } = require('controllers/activitypub/lib/activities')
const CONFIG = require('config')
const host = CONFIG.fullPublicHost()

const sanitization = {
  id: {
    // override couchUuid validation
    generic: 'string'
  },
  type: {
    allowlist: [ 'Follow' ]
  },
  '@context': {
    allowlist: [ 'https://www.w3.org/ns/activitystreams' ]
  },
  actor: {},
  object: {}
}

const controller = async params => {
  const { id, type } = params
  let { actor, object } = params
  if (!object.startsWith(host)) throw error_.new(`invalid object, string should start with ${host}`, 400, { object })
  const { name: requestedObjectName } = qs.parse(object)
  object = { name: requestedObjectName }
  const user = await user_.findOneByUsername(requestedObjectName)
  if (!user) throw error_.notFound({ username: requestedObjectName })
  if (!user.fediversable) throw error_.new('user is not on the fediverse', 404, { username: requestedObjectName })
  actor = { uri: actor }
  const res = await createActivity({ id, type, actor, object })
  const { object: resObject } = res
  return {
    '@context': [ 'https://www.w3.org/ns/activitystreams' ],
    id: res.externalId,
    type: 'Accept',
    actor: actor.uri,
    object: resObject
  }
}

module.exports = {
  sanitization,
  controller,
  track: [ 'activitypub', 'inbox' ]
}
