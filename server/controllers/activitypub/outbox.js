const error_ = require('lib/error/error')
const user_ = require('controllers/user/lib/user')
const couch_ = require('lib/couch')
const getOutbox = require('controllers/activitypub/lib/get_outbox')

const sanitization = {
  name: {},
  offset: {
    optional: true,
    default: null
  }
}

const controller = async params => {
  const { name } = params
  const user = await user_.byUsername(name).then(couch_.firstDoc)
  if (!user) throw error_.notFound(name)
  if (!user.fediversable) throw error_.new('user is not on the fediverse', 404, name)
  return getOutbox(params, user)
}

module.exports = {
  sanitization,
  controller,
  track: [ 'activitypub', 'outbox' ]
}
