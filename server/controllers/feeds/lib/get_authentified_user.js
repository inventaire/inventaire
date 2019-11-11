/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const CONFIG = require('config');
const __ = require('config').universalPath;
const _ = __.require('builders', 'utils');
const error_ = __.require('lib', 'error/error');
const user_ = __.require('controllers', 'user/lib/user');
const promises_ = __.require('lib', 'promises');

module.exports = function(requester, readToken){
  if (requester == null) { return promises_.resolve(null); }

  return user_.byId(requester)
  .catch(formatNotFound(requester))
  .then(validateUserReadToken(readToken));
};

var formatNotFound = requester => (function(err) {
  if (err.statusCode === 404) { err = error_.newInvalid('requester', requester); }
  throw err;
});

var validateUserReadToken = readToken => (function(user) {
  if (user.readToken === readToken) { return user;
  } else { throw error_.newInvalid('token', readToken); }
});
