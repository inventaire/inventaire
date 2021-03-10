const sanitize = require('lib/sanitize/sanitize')
const responses_ = require('lib/responses')
const error_ = require('lib/error/error')
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
