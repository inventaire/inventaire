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
  { ids: {} }

module.exports = (req, res) => sanitize(req, res, sanitization)
.get('ids')
.then(tasks_.byIds)
.then(responses_.Wrap(res, 'tasks'))
.catch(error_.Handler(req, res))
