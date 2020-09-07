const __ = require('config').universalPath
const sanitize = __.require('lib', 'sanitize/sanitize')
const responses_ = __.require('lib', 'responses')
const error_ = __.require('lib', 'error/error')
const { revertFromPatchId } = require('./lib/revert_edit')

const sanitization = {
  patch: {}
}

module.exports = (req, res) => {
  sanitize(req, res, sanitization)
  .then(({ patchId, reqUserId }) => revertFromPatchId(patchId, reqUserId))
  .then(responses_.Ok(res))
  .catch(error_.Handler(req, res))
}
