const _ = require('builders/utils')
const { customAuthReq } = require('./request')

const getByIds = async (user, ids, path) => {
  if (_.isArray(ids)) ids = ids.join('|')
  return customAuthReq(user, 'get', `/api/lists?action=by-ids&ids=${ids}`)
}

module.exports = {
  getListingById: async (user, id) => {
    const { lists } = await getByIds(user, id, 'lists')
    return lists[id]
  },
  addElements: async (user, { id, uris }) => {
    return customAuthReq(user, 'post', '/api/lists?action=add-elements', { id, uris })
  },
}
