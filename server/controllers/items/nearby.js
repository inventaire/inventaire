/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const __ = require('config').universalPath;
const _ = __.require('builders', 'utils');
const items_ = __.require('controllers', 'items/lib/items');
const user_ = __.require('controllers', 'user/lib/user');
const getItemsByUsers = require('./lib/get_items_by_users');
const sanitize = __.require('lib', 'sanitize/sanitize');
const responses_ = __.require('lib', 'responses');
const error_ = __.require('lib', 'error/error');
const { validateLimitAndOffset } = require('./lib/queries_commons');

const sanitization = {
  limit: {},
  offset: {},
  range: {},
  'include-users': {
    generic: 'boolean',
    default: true
  },
  'strict-range': {
    generic: 'boolean',
    default: false
  }
};

module.exports = function(req, res){
  const { _id:reqUserId } = req.user;
  return sanitize(req, res, sanitization)
  .then(params => user_.nearby(reqUserId, params.range, params.strictRange)
  .then(getItemsByUsers.bind(null, params))).then(responses_.Send(res))
  .catch(error_.Handler(req, res));
};
