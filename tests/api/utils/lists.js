const _ = require('builders/utils')
const { customAuthReq } = require('./request')

const getByIds = async (user, ids, path) => {
  if (_.isArray(ids)) ids = ids.join('|')
  return customAuthReq(user, 'get', `/api/${path}?action=by-ids&ids=${ids}`)
}

module.exports = {
  getListById: async (user, id) => {
    const { lists } = await getByIds(user, id, 'lists')
    return lists[id]
  },
}
