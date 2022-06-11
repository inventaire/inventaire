const searchUserItems = require('./lib/search_user_items')
const { filterPrivateAttributes } = require('controllers/items/lib/filter_private_attributes')
const { getAllowedVisibilityKeys } = require('lib/visibility/allowed_visibility_keys')

const sanitization = {
  user: {},
  search: {}
}

const controller = async ({ reqUserId, userId, search }) => {
  const allowedVisibilityKeys = await getAllowedVisibilityKeys(userId, reqUserId)
  const items = await searchUserItems({ search, userId, reqUserId, allowedVisibilityKeys })
  return {
    items: items.map(filterPrivateAttributes(reqUserId))
  }
}

module.exports = { sanitization, controller }
