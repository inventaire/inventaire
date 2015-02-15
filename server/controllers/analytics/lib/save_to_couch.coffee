CONFIG = require 'config'
__ = require('config').root
_ = __.require 'builders', 'utils'

analyticsCouchDB = __.require('couch', 'base')('analytics', 'reports')

module.exports = (analyticsLevelDB)->
  saveToCouch = ->
    stats =
      transfered: 0
      kept: 0
      dropped: 0
      refTime: _.now()
    analyticsLevelDB.sub.createValueStream()
    .on 'data', transferReportToCouch.bind(null, stats)
    .on 'end', logStats.bind(null, stats)

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


  # let 20 seconds to the server to finish to start before transfering
  setTimeout saveToCouch, 20 * 1000
  # the transfering every half hour
  setInterval saveToCouch, 30 * 60 * 1000

  return saveToCouch