CONFIG = require 'config'
__ = require('config').universalPath
_ = __.require 'builders', 'utils'

user_ = __.require 'lib', 'user/user'
promises_ = __.require 'lib', 'promises'
error_ = __.require 'lib', 'error/error'

excludedBots = require './excluded_bots'

module.exports = (analytics_)->
  recordSession = (req)->

    promises_.start()
    .then addUserInfo.bind(null, req)
    .then addUserId.bind(null, req)
    .then addFingerPrint
    .then analytics_.update
    .catch (err)->
      if err.type is 'dropped' then _.warn err.context, err.message
      else _.error err?.stack or err, 'recordSession err'

  addUserInfo = (req)->
    report = req.body or {}

    ip = analytics_.getHeadersIp(req)
    userAgent = req.headers['user-agent']

    if excludedBots.test userAgent
      throw error_.new 'excluding bots from analytics reports', 'dropped', ip

    report.user =
      ip: ip
      userAgent: userAgent
      lang: req.headers['accept-language']?.split(',')?[0]

    return report

  addUserId = (req, report)->
    unless req?.session?.email? then return report

    user_.getUserId(req)

    .then (userId)->
      report.user.id = userId
      return report
    .catch _.Error('addUserId err')

  addFingerPrint = (report)->
    {ip, userAgent} = report.user
    report.user.fingerPrint = analytics_.getFingerPrint(ip, userAgent)
    analytics_.onlineUser(report.user)
    return report

  return recordSession