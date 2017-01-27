CONFIG = require 'config'
__ = require('config').universalPath
_ = __.require 'builders', 'utils'
crypto_ = __.require 'lib', 'crypto'

module.exports = (data)->
  fingerPrint = getFingerPrint data
  # If we have a user id, the user is logged in
  if data.userId? then onlineUsers[fingerPrint] = 1
  else onlineUsers[fingerPrint] = 0

onlineUsers = {}
last = null

updateOnlineUsers = ->
  length = _.objLength(onlineUsers)
  loggedUsers = _.sumValues(onlineUsers)
  report = "logged in #{loggedUsers} / total #{length}"

  # Only log the amount of users online when there is a change
  unless report is last
    timestamp = new Date().toString().replace(/GMT.*/, 'GMT')
    _.info "[#{timestamp}] #{report}"
  last = report
  onlineUsers = {}

getFingerPrint = (args...)->
  str = JSON.stringify args
  return crypto_.md5 str

setInterval updateOnlineUsers, 30*1000
