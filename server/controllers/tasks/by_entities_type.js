const __ = require('config').universalPath
const responses_ = __.require('lib', 'responses')
const error_ = __.require('lib', 'error/error')
const tasks_ = require('./lib/tasks')
const sanitize = __.require('lib', 'sanitize/sanitize')

const sanitization = {
  type: {
    allowlist: [ 'work' ]
  },
  limit: {
    default: 10
  },
  offset: {
    default: 0
  }
}

module.exports = (req, res) => {
  sanitize(req, res, sanitization)
  .then(tasks_.byEntitiesType)
  .then(responses_.Wrap(res, 'tasks'))
  .catch(error_.Handler(req, res))
}
