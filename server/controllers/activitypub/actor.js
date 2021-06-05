const error_ = require('lib/error/error')
const getActor = require('controllers/activitypub/lib/get_actor')
const { sanitize } = require('lib/sanitize/sanitize')
const { verifySignature } = require('controllers/activitypub/lib/security')
const { tap } = require('lib/promises')

const sanitization = {
  name: {}
}

module.exports = async (req, res) => {
  sanitize(req, res, sanitization)
  .then(tap(() => verifySignature(req)))
  .then(params => {
    const { name } = params
    return getActor(name)
  })
  .then(res.json.bind(res))
  .catch(error_.Handler(req, res))
}
