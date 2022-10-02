const { validFilters } = require('./lib/queries_commons')
const getItemsByUsers = require('./lib/get_items_by_users')

const sanitization = {
  users: {},
  limit: { optional: true },
  offset: { optional: true },
  context: {
    generic: 'allowlist',
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

const controller = params => getItemsByUsers(params)

module.exports = { sanitization, controller }
