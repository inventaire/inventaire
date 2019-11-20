const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')
const { authReq } = require('./utils')

const utils = module.exports = {
  getByIds: ids => {
    if (_.isArray(ids)) { ids = ids.join('|') }
    return authReq('get', `/api/items?action=by-ids&ids=${ids}`)
  },

  getById: item => {
    return utils.getByIds(item._id)
    .then(res => res.items[0])
  }
}
