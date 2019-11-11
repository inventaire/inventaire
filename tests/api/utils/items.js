CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
{ authReq } = require './utils'

module.exports = utils =
  getByIds: (ids)->
    if _.isArray(ids) then ids = ids.join('|')
    authReq 'get', "/api/items?action=by-ids&ids=#{ids}"

  getById: (item)->
    utils.getByIds item._id
    .then (res)-> res.items[0]
