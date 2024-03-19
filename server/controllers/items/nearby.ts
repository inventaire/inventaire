import { getUsersNearby } from '#controllers/user/lib/user'
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
}

async function controller (params) {
  const { range, strictRange, reqUserId } = params
  const usersIds = await getUsersNearby(reqUserId, range, strictRange)
  return getItemsByUsers({ ...params, usersIds })
}

export default { sanitization, controller }
