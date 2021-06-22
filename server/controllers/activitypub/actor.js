const getActor = require('controllers/activitypub/lib/get_actor')

const sanitization = {
  name: {}
}

const controller = async params => {
  const { name } = params
  return getActor(name)
}

module.exports = {
  sanitization,
  controller,
  track: [ 'activitypub', 'actor' ]
}
