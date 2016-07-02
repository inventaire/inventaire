CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'

whitelist = ['lang']

module.exports =
  post: (req, res, next)->
    { body } = req
    { key, value } = body
    unless key in whitelist
      return error_.bundle req, res, 'non-whitelisted cookie', 403

    res.cookie key, value
    _.info result = "cookie set: #{key} = #{value}"
    res.send result
