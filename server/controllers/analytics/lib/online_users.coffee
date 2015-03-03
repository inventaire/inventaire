CONFIG = require 'config'
__ = require('config').root
_ = __.require 'builders', 'utils'

module.exports = (user)->
  {id, fingerPrint} = user
  if id? then onlineUsers[fingerPrint] = 1
  else onlineUsers[fingerPrint] = 0


onlineUsers = {}
last = null

updateOnlineUsers = ->
  length = _.objLength(onlineUsers)
  loggedUsers = _.sumValues(onlineUsers)
  report = "logged in #{loggedUsers} / total #{length}"
  unless report is last
    timestamp = new Date().toString().replace(/GMT.*/, 'GMT')
    _.info "[#{timestamp}] #{report}"
  last = report
  onlineUsers = {}

setInterval updateOnlineUsers, 30 * 1000
