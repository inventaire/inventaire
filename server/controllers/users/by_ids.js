const __ = require('config').universalPath
const error_ = __.require('lib', 'error/error')
const responses_ = __.require('lib', 'responses')
const user_ = __.require('controllers', 'user/lib/user')
const sanitize = __.require('lib', 'sanitize/sanitize')

const sanitization = {
  ids: {}
}

module.exports = (req, res) => {
  sanitize(req, res, sanitization)
  .then(params => {
    const { ids, reqUserId } = params
    if (reqUserId) { ids.push(reqUserId) }
    return user_.getUsersIndexByIds(ids)
    .then(responses_.Wrap(res, 'users'))
  })
  .catch(error_.Handler(req, res))
}
