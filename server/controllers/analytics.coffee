CONFIG = require 'config'
__ = require('config').root
_ = __.require 'builders', 'utils'

analytics_ = __.require 'lib', 'analytics'
user_ = __.require 'lib', 'user'
promises_ = __.require 'lib', 'promises'


# let 20 seconds to the server to finish to start before transfering
setTimeout analytics_.saveToCouch, 20 * 1000
# the transfering every hours
setInterval analytics_.saveToCouch, 30 * 60 * 1000

module.exports =
  reports: (req, res, next)->
    {navigation, error} = req.body
    if navigation? then recordSession(req)
    if error?
      if _.isArray(error) then error.map logIfNew
      else logIfNew(error)

    unless navigation? or error?
      _.error req.body, 'wrongly formatted client report'

    res.send('ok')


errors = {}
flushErrors = -> errors = {}
setInterval flushErrors, 24 * 3600 * 1000

logIfNew = (err)->
  {hash} = err
  unless errors[hash]
    _.error(err, 'client report')
    errors[hash] = true


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

  user_.getUserId(req.session.email)
  .then (userId)->
    report.user.id = userId
    return report
  .catch (err)-> _.error err, 'addUserId err'


addIpData = (report)->
  {ip} = report.user
  if ip?
    analytics_.getIpData(ip)
    .then (ipData)->
      report.user.country = ipData.country
      return report
    .catch (err)-> _.error err, 'addIpData err'

  else return report

addFingerPrint = (report)->
  {ip, userAgent} = report.user
  report.user.fingerPrint = analytics_.getFingerPrint(ip, userAgent)
  return report
