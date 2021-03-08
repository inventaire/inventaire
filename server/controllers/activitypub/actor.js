const error_ = require('lib/error/error')
const actor = require('controllers/activitypub/lib/actor')
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
    return actor(name)
  })
  .then(res.json.bind(res))
  .catch(error_.Handler(req, res))
}
