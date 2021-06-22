const error_ = require('lib/error/error')
const { sanitizeAsync } = require('lib/sanitize/sanitize')
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
  actor: {},
  object: {}
}

module.exports = async (req, res) => {
  // todo: refacto await
  sanitizeAsync(req, res, sanitization)
  .then(async params => {
    const { object } = params
    const { name: requestedObjectName } = qs.parse(object)
    const user = await user_.findOneByUsername(requestedObjectName)
    // TODO: return 403 instead
    if (!user.fediversable) throw error_.notFound({ username: requestedObjectName })
    return createActivity(params)
    .then(createAcceptResponse)
  })
  .then(res.json.bind(res))
  .catch(error_.Handler(req, res))
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
