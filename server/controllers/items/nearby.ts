import { getUsersNearby } from '#controllers/user/lib/user'
import type { SanitizedParameters } from '#types/controllers_input_sanitization_parameters'
import { getItemsByUsers } from './lib/get_items_by_users.js'

const sanitization = {
  limit: {},
  offset: {},
  range: {},
  'include-users': {
    generic: 'boolean',
    default: true,
  },
  'strict-range': {
    generic: 'boolean',
    default: false,
  },
} as const

async function controller (params: SanitizedParameters) {
  const { range, strictRange, reqUserId } = params
  const usersIds = await getUsersNearby(reqUserId, range, strictRange)
  return getItemsByUsers({ ...params, usersIds })
}

export default { sanitization, controller }
