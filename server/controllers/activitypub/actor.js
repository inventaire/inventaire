const error_ = require('lib/error/error')
const getActor = require('controllers/activitypub/lib/get_actor')
const { sanitizeAsync } = require('lib/sanitize/sanitize')

const sanitization = {
  name: {}
}

module.exports = async (req, res) => {
  sanitizeAsync(req, res, sanitization)
  .then(params => {
    const { name } = params
    return getActor(name)
  })
  .then(res.json.bind(res))
  .catch(error_.Handler(req, res))
}
