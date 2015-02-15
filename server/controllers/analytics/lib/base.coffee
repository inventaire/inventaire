CONFIG = require 'config'
__ = require('config').root
_ = __.require 'builders', 'utils'
Promise = require 'bluebird'
crypto = require 'crypto'

levelBase = __.require 'level', 'base'
analyticsLevelDB = levelBase.simpleAPI 'analytics'
cache_ = __.require 'lib', 'cache'
satelize = Promise.promisify require('satelize').satelize

module.exports =
  update: (report)->
    key = report._id
    analyticsLevelDB.put key, report
    .catch (err)-> _.error err, "coudnt update analyticsLevelDB for #{key}"

  getIpData: (ip)->
    key = "ip:#{ip}"
    cache_.get key, satelize.bind(null, {ip: ip})
    .then JSON.parse
    .catch (err)-> _.warn err, 'couldnt recover ip data'

  getHeadersIp: (req)->
    ip = req.headers['x-forwarded-for']
    if not ip? and CONFIG.env is 'production'
      _.warn "no ip found in header['x-forwarded-for']
              (normal when the server isnt behing a proxy)"
    return ip

  getFingerPrint: (args...)->
    str = JSON.stringify(args)
    crypto.createHash('md5').update(str).digest('hex')

  saveToCouch: require('./save_to_couch')(analyticsLevelDB)
  onlineUser: require './online_users'
