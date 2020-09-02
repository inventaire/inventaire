const __ = require('config').universalPath
const error_ = __.require('lib', 'error/error')
const responses_ = __.require('lib', 'responses')
const updateClaim = require('./lib/update_claim')
const sanitize = __.require('lib', 'sanitize/sanitize')

const sanitization = {
  uri: {},
  id: { optional: true },
  'new-value': { optional: true },
  'old-value': { optional: true },
  property: { type: 'string' }
}

module.exports = (req, res) => {
  sanitize(req, res, sanitization)
  .then(params => {
    let { uri, id, property, 'old-value': oldVal, 'new-value': newVal } = params
    const noValues = !oldVal && !newVal
    if (noValues) {
      const message = 'missing parameter in body: old-value or new-value'
      return error_.bundle(req, res, message, 400, params)
    }
    if (id && (uri == null)) { uri = `inv:${id}` }

    return updateClaim(req.user, uri, property, oldVal, newVal)
    .then(responses_.Ok(res))
  })
  .catch(error_.Handler(req, res))
}
