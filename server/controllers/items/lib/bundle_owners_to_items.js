const _ = require('builders/utils')
const user_ = require('controllers/user/lib/user')
const error_ = require('lib/error/error')

module.exports = (res, reqUserId, items) => {
  if (!(items && items.length > 0)) throw error_.new('no item found', 404)
  const usersIds = getItemsOwners(items)
  return user_.getUsersByIds(usersIds, reqUserId)
  .then(users => res.json({ items, users }))
}

const getItemsOwners = items => {
  const users = items.map(item => item.owner)
  return _.uniq(users)
}
