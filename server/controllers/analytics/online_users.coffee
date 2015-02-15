CONFIG = require 'config'
__ = require('config').root
_ = __.require 'builders', 'utils'

module.exports = (user)->
  {id, fingerPrint} = user
  if id? then onlineUsers[fingerPrint] = 1
  else onlineUsers[fingerPrint] = 0


onlineUsers = {}

updateOnlineUsers = ->
  length = _.objLength(onlineUsers)
  loggedUsers = _.sumValues(onlineUsers)
  _.info "logged in #{loggedUsers} / total #{length}"
  onlineUsers = {}

setInterval updateOnlineUsers, 30 * 1000
