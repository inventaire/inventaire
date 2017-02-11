CONFIG = require 'config'
__ = require('config').universalPath
_ = __.require 'builders', 'utils'
error_ = __.require 'lib', 'error/error'
user_ = __.require 'lib', 'user/user'
promises_ = __.require 'lib', 'promises'

module.exports = (requester, readToken)->
  unless requester? then return promises_.resolve null

  user_.byId requester
  .catch formatNotFound
  .then validateUserReadToken(readToken)

formatNotFound = (err)->
  if err.statusCode is 404
    err.message = 'invalid requester id'
    err.statusCode = 400

  throw err

validateUserReadToken = (readToken)-> (user)->
  if user.readToken is readToken then return user
  else throw error_.new 'invalid token', 400, user._id, readToken
