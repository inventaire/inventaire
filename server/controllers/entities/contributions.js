/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
// An endpoint to list entities edits made by a user
const __ = require('config').universalPath;
const _ = __.require('builders', 'utils');
const error_ = __.require('lib', 'error/error');
const promises_ = __.require('lib', 'promises');
const sanitize = __.require('lib', 'sanitize/sanitize');
const responses_ = __.require('lib', 'responses');
const entities_ = require('./lib/entities');
const patches_ = require('./lib/patches');

const sanitization = {
  user: {},
  limit: { default: 50, max: 100 },
  offset: { default: 0 }
};

module.exports = (req, res) => sanitize(req, res, sanitization)
.then(function(params){
  const { user:userId, limit, offset } = params;
  return patches_.byUserId(userId, limit, offset);}).then(responses_.Send(res))
.catch(error_.Handler(req, res));
