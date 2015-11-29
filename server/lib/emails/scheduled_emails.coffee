



# requires to re-npmis "node-schedule"


CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'

waitingEmails = __.require('level', 'base').simpleAPI 'waiting'
sendEmail = require './send_email'
schedule = require 'node-schedule'
rule = new schedule.RecurrenceRule()
rule.hour = 6 # jobs will run everyday at 6:00 GMT


module.exports = ->
  # Radio.on 'notify:friendship:request', stockJob

  # scheduledJobs.friendshipRequests()




scheduledJobs =
  friendshipRequests: ->
    schedule.scheduleJob rule, jobs.friendshipRequests.bind(null, sendEmail)


jobs =
  friendshipRequests: (mailer)->
    getRequestsList()
    .then getRequestsTuples
    .then (tuples)->
      for tuple in tuples
        [userToNotify, requestingUser] = tuple
        mailer userToNotify, requestingUser


planFriendshipRequestEmail = (userToNotify, requestingUser)->
  type = 'friendshipRequest'
  key = "#{userToNotify}:#{type}:#{requestingUser}"
  waitingEmails.get key
  .then (res)->
    _.log res, 'waitingEmails res'
    userList = res or {}
    userList[type] or= {}
    userList[type][requestingUser] or= []





