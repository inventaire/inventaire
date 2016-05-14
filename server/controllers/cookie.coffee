CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'

module.exports =
  post: (req, res, next)->
    whitelist = ['lang']
    { body } = req
    { key, value } = body
    unless key in whitelist
      return error_.bundle res, 'unauthorize cookie setting', 403

    res.cookie key = key, value = value
    _.info result = "cookie set: #{key} = #{value}"
    res.send result