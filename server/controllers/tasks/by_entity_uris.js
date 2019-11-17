// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
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

const sanitization =
  { uris: {} }

const byEntityUris = fnName => (req, res) => sanitize(req, res, sanitization)
.get('uris')
.then(uris => tasks_[fnName](uris, { index: true }))
.then(responses_.Wrap(res, 'tasks'))
.catch(error_.Handler(req, res))

module.exports = {
  bySuspectUris: byEntityUris('bySuspectUris'),
  bySuggestionUris: byEntityUris('bySuggestionUris')
}
