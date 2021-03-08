const __ = require('config').universalPath
const responses_ = require('lib/responses')
const error_ = require('lib/error/error')
const tasks_ = require('./lib/tasks')
const sanitize = require('lib/sanitize/sanitize')

const sanitization = {
  uris: {}
}

const byEntityUris = fnName => (req, res) => {
  sanitize(req, res, sanitization)
  .then(({ uris }) => uris)
  .then(uris => tasks_[fnName](uris, { index: true }))
  .then(responses_.Wrap(res, 'tasks'))
  .catch(error_.Handler(req, res))
}

module.exports = {
  bySuspectUris: byEntityUris('bySuspectUris'),
  bySuggestionUris: byEntityUris('bySuggestionUris')
}
