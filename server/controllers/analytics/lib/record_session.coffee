CONFIG = require 'config'
__ = require('config').universalPath
_ = __.require 'builders', 'utils'

promises_ = __.require 'lib', 'promises'
error_ = __.require 'lib', 'error/error'

excludedBots = require './excluded_bots'

module.exports = (analytics_)->
  recordSession = (req)->
    promises_.start
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
      id: req.user?._id
      ip: ip
      userAgent: userAgent
      lang: req.headers['accept-language']?.split(',')?[0]

    return report

  addUserId = (req, report)->
    unless req?.session?.email? then return report

    userId = req.user._id
    report.user.id = userId
    return report

  addFingerPrint = (report)->
    { ip, userAgent } = report.user
    report.user.fingerPrint = analytics_.getFingerPrint(ip, userAgent)
    analytics_.onlineUser(report.user)
    return report

  return recordSession