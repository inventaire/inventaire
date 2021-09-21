const _ = require('builders/utils')
const { authReq, customAuthReq, getUser } = require('./utils')

const utils = module.exports = {
  getByIds: ids => {
    if (_.isArray(ids)) ids = ids.join('|')
    return authReq('get', `/api/items?action=by-ids&ids=${ids}`)
  },

  getById: item => {
    return utils.getByIds(item._id)
    .then(res => res.items[0])
  },

  deleteByIds: ids => {
    ids = _.forceArray(ids)
    return authReq('post', '/api/items?action=delete-by-ids', { ids })
  },

  update: ({ ids, attribute, value, user }) => {
    ids = _.forceArray(ids)
    user = user || getUser()
    return customAuthReq(user, 'put', '/api/items?action=bulk-update', { ids, attribute, value })
  }
}
