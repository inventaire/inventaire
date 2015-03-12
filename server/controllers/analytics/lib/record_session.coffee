CONFIG = require 'config'
__ = require('config').root
_ = __.require 'builders', 'utils'

user_ = __.require 'lib', 'user'
promises_ = __.require 'lib', 'promises'

module.exports = (analytics_)->
  recordSession = (req)->
    addUserInfo(req)
    .then addUserId.bind(null, req)
    .then addIpData
    .then addFingerPrint
    .then analytics_.update
    .catch (err)-> _.error err?.stack or err, 'recordSession err'


  addUserInfo = (req)->
    report = req.body or {}
    report.user =
      ip: analytics_.getHeadersIp(req)
      userAgent: req.headers['user-agent']
      lang: req.headers['accept-language']?.split(',')?[0]

    return promises_.resolve report

  addUserId = (req, report)->
    unless req?.session?.email? then return report

    user_.getUserId(req)

    .then (userId)->
      report.user.id = userId
      return report
    .catch (err)-> _.error err, 'addUserId err'


  addIpData = (report)->
    {ip} = report.user
    if ip?
      analytics_.getIpData(ip)
      .then (ipData)->
        if ipData?
          report.user.country = ipData.country
        return report
      .catch (err)-> _.error err, 'addIpData err'

    else return report

  addFingerPrint = (report)->
    {ip, userAgent} = report.user
    report.user.fingerPrint = analytics_.getFingerPrint(ip, userAgent)
    analytics_.onlineUser(report.user)
    return report

  return recordSession