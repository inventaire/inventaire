CONFIG = require 'config'
__ = require('config').root
_ = __.require 'builders', 'utils'
crypto_ = __.require 'lib', 'crypto'

levelBase = __.require 'level', 'base'
analyticsLevelDB = levelBase.simpleAPI 'analytics'

base =
  update: (report)->
    key = report._id
    analyticsLevelDB.put key, report
    .catch (err)-> _.error err, "coudnt update analyticsLevelDB for #{key}"

  getHeadersIp: (req)->
    ip = req.headers['x-forwarded-for']
    if not ip? and CONFIG.env is 'production'
      _.warn "no ip found in header['x-forwarded-for']
              (normal when the server isnt behing a proxy)"
    return ip

  getFingerPrint: (args...)->
    str = JSON.stringify args
    crypto_.md5 str


module.exports = _.extend base,
  recordSession: require('./record_session')(base)
  saveToCouch: require('./save_to_couch')(analyticsLevelDB)
  onlineUser: require './online_users'
  logErrorIfNew: require './log_error_if_new'