const getOutbox = require('controllers/activitypub/lib/get_outbox')

const sanitization = {
  name: {}
}

const controller = async params => {
  const { name } = params
  return getOutbox(name)
}

module.exports = {
  sanitization,
  controller,
  track: [ 'activitypub', 'outbox' ]
}
