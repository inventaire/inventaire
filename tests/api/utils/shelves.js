import _ from '#builders/utils'
import { forceArray } from '#lib/utils/base'
import { customAuthReq } from './request.js'
import { getUser } from './utils.js'

const getShelvesByIds = async (user, ids) => {
  if (_.isArray(ids)) ids = ids.join('|')
  return customAuthReq(user, 'get', `/api/shelves?action=by-ids&ids=${ids}`)
}

export default {
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
  },
  getActorName: shelf => `shelf-${shelf._id}`,

  updateShelf: async ({ id, attribute, value, user }) => {
    user = user || getUser()
    return customAuthReq(user, 'post', '/api/shelves?action=update', {
      shelf: id,
      [attribute]: value
    })
  },

  deleteShelves: async ({ user, ids }) => {
    user = user || getUser()
    ids = forceArray(ids)
    return customAuthReq(user, 'post', '/api/shelves?action=delete', {
      ids,
    })
  }
}
