/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const __ = require('config').universalPath;
const _ = __.require('builders', 'utils');
const items_ = __.require('controllers', 'items/lib/items');
const error_ = __.require('lib', 'error/error');
const promises_ = __.require('lib', 'promises');
const sanitize = __.require('lib', 'sanitize/sanitize');
const responses_ = __.require('lib', 'responses');
const { validFilters } = require('./lib/queries_commons');
const getItemsByUsers = require('./lib/get_items_by_users');

const sanitization = {
  users: {},
  limit: { optional: true },
  offset: { optional: true },
  filter: {
    whitelist: validFilters,
    optional: true
  },
  'include-users': {
    generic: 'boolean',
    // Not including the associated users by default as this endpoint assumes
    // the requester already knows the users
    default: false
  }
};

module.exports = (req, res) => sanitize(req, res, sanitization)
.then(getItemsByUsers)
.then(responses_.Send(res))
.catch(error_.Handler(req, res));
