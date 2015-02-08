CONFIG = require 'config'
__ = require('config').root
_ = __.require 'builders', 'utils'

analytics_ = __.require 'lib', 'analytics'
user_ = __.require 'lib', 'user'


# let 2 minutes to the server to finish to start before transfering
setTimeout analytics_.saveToCouch, 2 * 60 * 1000
# the transfering every hours
setInterval analytics_.saveToCouch, 60 * 60 * 1000

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
  unless errors[err.hash]
    _.error(err, 'client report')
    errors[err.hash] = true
  else _.log 'avoided'


recordSession = (req)->
  addUserInfo(req)
  .then addIpData
  .then addFingerPrint
  .then analytics_.update
  .catch (err)-> _.error err.stack or err, 'recordSession err'

addUserInfo = (req)->
  report = req.body or {}
  user_.getUserId(req.session.email)
  .then (userId)->
    report.user =
      id: userId
      ip: analytics_.getIp(req)
      userAgent: req.headers['user-agent']
      lang: req.headers['accept-language']?.split(',')?[0]

    return report

addIpData = (report)->
  {ip} = report.user
  if ip?
    analytics_.getIpData(ip)
    .then (ipData)->
      report.user.country = ipData.country
      return report

  else return report

addFingerPrint = (report)->
  {ip, userAgent} = report.user
  report.user.fingerPrint = analytics_.getFingerPrint(ip, userAgent)
  return report


