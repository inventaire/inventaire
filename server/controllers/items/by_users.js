const __ = require('config').universalPath
const error_ = require('lib/error/error')
const sanitize = require('lib/sanitize/sanitize')
const responses_ = require('lib/responses')
const { validFilters } = require('./lib/queries_commons')
const getItemsByUsers = require('./lib/get_items_by_users')

const sanitization = {
  users: {},
  limit: { optional: true },
  offset: { optional: true },
  filter: {
    allowlist: validFilters,
    optional: true
  },
  'include-users': {
    generic: 'boolean',
    // Not including the associated users by default as this endpoint assumes
    // the requester already knows the users
    default: false
  }
}

module.exports = (req, res) => {
  sanitize(req, res, sanitization)
  .then(getItemsByUsers)
  .then(responses_.Send(res))
  .catch(error_.Handler(req, res))
}
