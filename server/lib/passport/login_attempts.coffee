CONFIG = require 'config'
__ = require('config').root
_ = __.require 'builders', 'utils'
{ oneMinute } =  __.require 'lib', 'times'

attemptsLimit = 10
periodMinutes = 5

fails = {}
flushFails = -> fails = {}

setInterval flushFails, periodMinutes*oneMinute

module.exports =
  _fails: -> fails
  _flushFails: flushFails
  recordFail: (username, label)->
    fails[username] or= 0
    fails[username]++

  tooMany: (username)->
    fails[username]? and fails[username] >= attemptsLimit
