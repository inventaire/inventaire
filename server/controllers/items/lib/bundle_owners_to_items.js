const _ = require('builders/utils')
const user_ = require('controllers/user/lib/user')
const error_ = require('lib/error/error')

module.exports = async (items, reqUserId) => {
  if (!(items && items.length > 0)) throw error_.new('no item found', 404)
  const usersIds = getItemsOwners(items)
  const users = await user_.getUsersByIds(usersIds, reqUserId)
  return { items, users }
}

const getItemsOwners = items => {
  const users = items.map(item => item.owner)
  return _.uniq(users)
}
