/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const __ = require('config').universalPath;
const _ = __.require('builders', 'utils');
const promises_ = __.require('lib', 'promises');
const user_ = __.require('controllers', 'user/lib/user');
const error_ = __.require('lib', 'error/error');
const sanitize = __.require('lib', 'sanitize/sanitize');
const responses_ = __.require('lib', 'responses');

const sanitization =
  {range: {}};

module.exports = function(req, res){
  const reqUserId = req.user != null ? req.user._id : undefined;
  return sanitize(req, res, sanitization)
  .then(params => user_.nearby(reqUserId, params.range))
  .then(usersIds => user_.getUsersByIds(usersIds, reqUserId))
  .then(responses_.Wrap(res, 'users'))
  .catch(error_.Handler(req, res));
};
