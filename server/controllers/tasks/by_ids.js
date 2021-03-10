const responses_ = require('lib/responses')
const error_ = require('lib/error/error')
const tasks_ = require('./lib/tasks')
const sanitize = require('lib/sanitize/sanitize')

const sanitization = {
  ids: {}
}

module.exports = (req, res) => {
  sanitize(req, res, sanitization)
  .then(({ ids }) => ids)
  .then(tasks_.byIds)
  .then(responses_.Wrap(res, 'tasks'))
  .catch(error_.Handler(req, res))
}
