// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
let utils
const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')
const { authReq } = require('./utils')

module.exports = (utils = {
  getByIds(ids){
    if (_.isArray(ids)) { ids = ids.join('|') }
    return authReq('get', `/api/items?action=by-ids&ids=${ids}`)
  },

  getById(item){
    return utils.getByIds(item._id)
    .then(res => res.items[0])
  }
})
