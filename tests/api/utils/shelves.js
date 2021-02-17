const __ = require('config').universalPath
const _ = __.require('builders', 'utils')
const { customAuthReq } = require('./request')
const { getUser } = require('./utils')

const getShelvesByIds = async (user, ids) => {
  if (_.isArray(ids)) ids = ids.join('|')
  return customAuthReq(user, 'get', `/api/shelves?action=by-ids&ids=${ids}`)
}

module.exports = {
  getShelfById: async (user, shelfId) => {
    const { shelves } = await getShelvesByIds(user, shelfId)
    return shelves[shelfId]
  },

  addItemsToShelf: async (user, shelfId, itemsIds) => {
    shelfId = shelfId._id || shelfId
    if (typeof itemsIds[0] === 'object') itemsIds = _.map(itemsIds, '_id')
    user = user || getUser()
    const { shelves } = await customAuthReq(user, 'post', '/api/shelves?action=add-items', {
      id: shelfId,
      items: itemsIds
    })
    return shelves
  }
}
