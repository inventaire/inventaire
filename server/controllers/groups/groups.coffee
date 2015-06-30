CONFIG = require 'config'
__ = CONFIG.root
_ = __.require 'builders', 'utils'
error_ = __.require 'lib', 'error/error'
create = require './create'
invite = require './invite'

module.exports =
  post: (req, res, next)->
    { action } = req.body
    switch action
      when 'create' then create req, res
      else error_.unknownAction res
