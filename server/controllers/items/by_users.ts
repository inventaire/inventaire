import getItemsByUsers from './lib/get_items_by_users.js'

const sanitization = {
  users: {},
  limit: { optional: true },
  offset: { optional: true },
  context: {
    optional: true,
  },
  'include-users': {
    generic: 'boolean',
    // Not including the associated users by default as this endpoint assumes
    // the requester already knows the users
    default: false,
  },
}

const controller = params => getItemsByUsers(params)

export default { sanitization, controller }
