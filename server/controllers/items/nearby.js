const user_ = require('controllers/user/lib/user')
const getItemsByUsers = require('./lib/get_items_by_users')

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
}

const controller = async params => {
  const { range, strictRange, reqUserId } = params
  const usersIds = await user_.nearby(reqUserId, range, strictRange)
  return getItemsByUsers(params, usersIds)
}

module.exports = { sanitization, controller }
