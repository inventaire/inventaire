const __ = require('config').universalPath
const user_ = __.require('controllers', 'user/lib/user')
const error_ = __.require('lib', 'error/error')
const responses_ = __.require('lib', 'responses')
const sanitize = __.require('lib', 'sanitize/sanitize')

const sanitization = {
  bbox: {},
}

module.exports = (req, res) => {
  sanitize(req, res, sanitization)
  .then(async ({ bbox, reqUserId }) => {
    const users = await user_.byPosition(bbox)
    return user_.getUsersAuthorizedData(users, reqUserId)
  })
  .then(responses_.Wrap(res, 'users'))
  .catch(error_.Handler(req, res))
}
