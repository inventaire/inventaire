CONFIG = require 'config'
__ = require('config').root
_ = __.require 'builders', 'utils'

attemptsLimit = 10
periodMinutes = 5

fails = {}
flushFails = -> fails = {}

setInterval flushFails, periodMinutes*60*1000

module.exports =
  _fails: -> fails
  _flushFails: flushFails
  recordFail: (username, label)->
    _.warn username, "failed login attempt after #{label}"
    fails[username] or= 0
    fails[username]++

  tooMany: (username)->
    fails[username]? and fails[username] >= attemptsLimit
    