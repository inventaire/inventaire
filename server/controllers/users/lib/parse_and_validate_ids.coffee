__ = require('config').universalPath
_ = __.require 'builders', 'utils'
error_ = __.require 'lib', 'error/error'
User = __.require 'models', 'user'

module.exports = (ids)->
  unless _.isNonEmptyString ids then throw error_.new 'missing ids', 400, ids

  ids = ids.split '|'
  if ids?.length > 0 and validUserIds(ids) then return ids
  else throw error_.new 'invalid ids', 400, ids

validUserIds = (ids)-> _.all ids, User.tests.userId
