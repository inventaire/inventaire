const _ = require('builders/utils')
const { authReq, customAuthReq, getUser } = require('./utils')

const utils = module.exports = {
  getItemsByIds: ids => {
    if (_.isArray(ids)) ids = ids.join('|')
    return authReq('get', `/api/items?action=by-ids&ids=${ids}`)
  },

  getItemById: async id => {
    const { items } = await utils.getItemsByIds(id)
    return items[0]
  },

  getItem: async item => utils.getItemById(item._id),

  deleteItemsByIds: ids => {
    ids = _.forceArray(ids)
    return authReq('post', '/api/items?action=delete-by-ids', { ids })
  },

  updateItems: ({ ids, attribute, value, user }) => {
    ids = _.forceArray(ids)
    user = user || getUser()
    return customAuthReq(user, 'put', '/api/items?action=bulk-update', { ids, attribute, value })
  }
}
