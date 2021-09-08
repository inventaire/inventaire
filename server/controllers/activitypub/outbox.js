const error_ = require('lib/error/error')
const user_ = require('controllers/user/lib/user')
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
  const user = await user_.findOneByUsername(name)
  if (!user || !user.fediversable) throw error_.notFound({ name })
  return getOutbox(params, user)
}

module.exports = {
  sanitization,
  controller,
  track: [ 'activitypub', 'outbox' ]
}
