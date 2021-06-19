const searchUserItems = require('./lib/search_user_items')
const getInventoryAccessLevel = require('./lib/get_inventory_access_level')

const sanitization = {
  user: {},
  search: {}
}

const controller = async ({ reqUserId, userId, search }) => {
  const accessLevel = await getInventoryAccessLevel(userId, reqUserId)
  const items = await searchUserItems({ search, userId, accessLevel })
  return { items }
}

module.exports = { sanitization, controller }
