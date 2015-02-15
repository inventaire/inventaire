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
    .catch (err)-> _.warn err, 'couldnt recover ip data'

  saveToCouch: ->
    stats =
      transfered: 0
      kept: 0
      dropped: 0
      refTime: _.now()
    analyticsLevelDB.sub.createValueStream()
    .on 'data', transferReportToCouch.bind(null, stats)
    .on 'end', logStats.bind(null, stats)

  getHeadersIp: (req)->
    ip = req.headers['x-forwarded-for']
    if not ip? and CONFIG.env is 'production'
      _.warn "no ip found in header['x-forwarded-for']
              (normal when the server isnt behing a proxy)"
    return ip

  getFingerPrint: (args...)->
    str = JSON.stringify(args)
    crypto.createHash('md5').update(str).digest('hex')

  onlineUser: require './online_users'

transferReportToCouch = (stats, doc)->
  _.types arguments, ['object', 'string']
  {refTime} = stats
  doc = JSON.parse(doc)
  if sessionIsOver(refTime, doc?.time?.last)
    putInCouch(doc)
    .then clearLevel.bind(null, stats, doc._id)
    .catch (err)-> _.error err, 'coulndt put report in couch'
  else
    stats.kept++


sessionIsOver = (refTime, lastTime)->
  if lastTime?
    # JSON conversions messes with the type
    lastTime = Number(lastTime)
    # arbitrary choosing 5 minutes
    # given session with last time older than 30 sec are finished
    HalfAnHour = 30 * 60 * 1000
    return (lastTime + HalfAnHour) < refTime
  else return false

putInCouch = (doc)->
  _.type doc, 'object'
  doc.type = 'report'
  analyticsCouchDB.put(doc)

clearLevel = (stats, docId, res)->
  _.types arguments, ['object', 'string', 'object']
  if res.ok
    _.log docId, 'succesfully transfered to couch. deleting in level'
    stats.transfered++
    analyticsLevelDB.del docId
  else
    _.log arguments, docId
    if res.error is 'conflict'
      _.warn 'report in conflict: dropping report update'
      analyticsLevelDB.del docId
      stats.dropped++
    else
      _.warn "not transfered to couch: #{docId}"
      stats.kept++

logStats = (stats)->
  cb = -> _.info(stats, "analytics transfered to Couchdb")
  setTimeout cb , 60*1000
