CONFIG = require 'config'
__ = require('config').universalPath
_ = __.require 'builders', 'utils'
error_ = __.require 'lib', 'error/error'
user_ = __.require 'controllers', 'user/lib/user'
promises_ = __.require 'lib', 'promises'

module.exports = (requester, readToken)->
  unless requester? then return promises_.resolve null

  user_.byId requester
  .catch formatNotFound(requester)
  .then validateUserReadToken(readToken)

formatNotFound = (requester)-> (err)->
  if err.statusCode is 404 then err = error_.newInvalid 'requester', requester
  throw err

validateUserReadToken = (readToken)-> (user)->
  if user.readToken is readToken then return user
  else throw error_.newInvalid 'token', readToken
