import type { SanitizedParameters } from '#types/controllers_input_sanitization_parameters'
import { getItemsByUsers } from './lib/get_items_by_users.js'

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
} as const

async function controller ({ users: usersIds, limit, offset, context, includeUsers, reqUserId }: SanitizedParameters) {
  return getItemsByUsers({ usersIds, limit, offset, context, includeUsers, reqUserId })
}

export default { sanitization, controller }
