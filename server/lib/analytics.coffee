CONFIG = require 'config'
__ = require('config').root
_ = __.require 'builders', 'utils'
Promise = require 'bluebird'
crypto = require 'crypto'

levelBase = __.require 'level', 'base'
analyticsLevelDB = levelBase.simpleAPI 'analytics'
cache_ = __.require 'lib', 'cache'
satelize = Promise.promisify require('satelize').satelize

analyticsCouchDB = __.require('couch', 'base')('analytics', 'reports')

module.exports =
  update: (report)->
    key = report._id
    analyticsLevelDB.put key, report
    .catch (err)-> _.error err, "coudnt update analyticsLevelDB for #{key}"

  getIpData: (ip)->
    key = "ip:#{ip}"
    cache_.get key, satelize.bind(null, {ip: ip})
    .then JSON.parse

  saveToCouch: ->
    stats =
      transfered: 0
      kept: 0
      refTime: _.now()
    analyticsLevelDB.sub.createValueStream()
    .on 'data', transferReportToCouch.bind(null, stats)
    .on 'end', ->
      _.info stats, "analytics transfered to Couchdb"



  getIp: (req)->
    ip = req.header['x-forwarded-for']
    if not ip? and CONFIG.env is 'production'
      _.warn "no ip found in header['x-forwarded-for']
              (normal when the server isnt behing a proxy)"
    return ip

  getFingerPrint: (args...)->
    str = JSON.stringify(args)
    crypto.createHash('md5').update(str).digest('hex')


transferReportToCouch = (stats, doc)->
  {refTime} = stats
  doc = JSON.parse(doc)
  if sessionIsOver(refTime, doc.time?.last)
    putInCouch(doc)
    .then clearLevel.bind(null, stats)
    .catch (err)-> _.log err, 'coulndt put report in couch'
  else
    stats.kept++


sessionIsOver = (refTime, lastTime)->
  if lastTime?
    # arbitrary choosing 5 minutes
    # given session with last time older than 30 sec are finished
    FiveMinutes = 5 * 60 * 1000
    return (lastTime + FiveMinutes) < refTime

putInCouch = (doc)->
  doc.type = 'report'
  analyticsCouchDB.put(doc)

clearLevel = (stats, res)->
  if res.ok
    _.log doc._id, 'succesfully transfered to couch. deleting in level'
    stats.transfered++
    analyticsLevelDB.del doc._id
  else
    stats.kept++
    throw new Error "failed to transfered to couch: #{doc._id}"