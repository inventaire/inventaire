const __ = require('config').universalPath
const _ = __.require('builders', 'utils')
const { customAuthReq } = require('./request')
const { getUser } = require('./utils')

module.exports = {
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
