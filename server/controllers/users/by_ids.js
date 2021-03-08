const __ = require('config').universalPath
const error_ = require('lib/error/error')
const responses_ = require('lib/responses')
const user_ = require('controllers/user/lib/user')
const sanitize = require('lib/sanitize/sanitize')

const sanitization = {
  ids: {}
}

module.exports = (req, res) => {
  sanitize(req, res, sanitization)
  .then(params => {
    const { ids, reqUserId } = params
    return user_.getUsersIndexByIds(ids, reqUserId)
  })
  .then(responses_.Wrap(res, 'users'))
  .catch(error_.Handler(req, res))
}
