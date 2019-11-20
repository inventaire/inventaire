
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const __ = require('config').universalPath
const responses_ = __.require('lib', 'responses')
const error_ = __.require('lib', 'error/error')
const tasks_ = require('./lib/tasks')
const sanitize = __.require('lib', 'sanitize/sanitize')

const sanitization = {
  limit: {
    default: 10
  },
  offset: {
    default: 0
  }
}

module.exports = (req, res) => {
  sanitize(req, res, sanitization)
  .then(tasks_.byScore)
  .then(responses_.Wrap(res, 'tasks'))
  .catch(error_.Handler(req, res))
}
