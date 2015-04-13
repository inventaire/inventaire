CONFIG = require 'config'
__ = CONFIG.root
_ = __.require 'builders', 'utils'
{ itemId, userId, entityUri } = require './common-tests'

module.exports =
  itemId: itemId
  userId: userId
  entity: entityUri
  title: (str)->
    _.type str, 'string'
    return str.length > 0
  pictures: (pictures)-> _.isArray(pictures)
