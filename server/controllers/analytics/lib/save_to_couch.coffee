CONFIG = require 'config'
{ verbosity } = CONFIG
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
promises_ = __.require 'lib', 'promises'
{ oneMinute, halfAnHour} =  __.require 'lib', 'times'

analyticsCouchDB = __.require('couch', 'base')('analytics', 'reports')

module.exports = (analyticsLevelDB)->
  saveToCouch = ->
    stats =
      transfered: 0
      kept: 0
      dropped: 0
      refTime: Date.now()
    analyticsLevelDB.sub.createValueStream()
    .on 'data', transferReportToCouch.bind(null, stats)
    .on 'end', logStats.bind(null, stats)

  transferReportToCouch = (stats, doc)->
    { refTime } = stats
    doc = JSON.parse doc
    if sessionIsOver refTime, doc?.time?.last
      putInCouchIfError doc
      .then clearLevel.bind(null, stats, doc._id)
      .catch dropIfConflict.bind(null, stats, doc._id)
      .catch _.Error('report transfer err')
    else
      stats.kept++

  sessionIsOver = (refTime, lastTime)->
    if lastTime?
      # JSON conversions messes with the type
      lastTime = Number lastTime
      # arbitrary choosing 30 minutes
      # given session with last time older than 30 sec are finished
      return (lastTime + halfAnHour) < refTime
    else return false

  putInCouchIfError = (doc)->
    # Only keeping sessions that had errors as analytics is now handled by Piwik
    unless doc.error? then return promises_.resolved
    _.type doc, 'object'
    doc.type = 'report'
    analyticsCouchDB.put doc

  clearLevel = (stats, docId)->
    if verbosity > 1
      _.log docId, 'succesfully transfered to couch. deleting in level'
    stats.transfered++
    analyticsLevelDB.del docId

  dropIfConflict = (stats, docId, err)->
    # delete the doc in any case
    analyticsLevelDB.del docId
    if err.statusCode is 409
      _.warn 'report in conflict: dropping report update'
      stats.dropped++
    else
      throw err

  logStats = (stats)->
    if verbosity > 2 then _.info stats, 'analytics transfered to Couchdb'

  # let 20 seconds to the server to finish to start before transfering
  setTimeout saveToCouch, 20 * 1000
  # the transfering every half hour
  setInterval saveToCouch, halfAnHour

  return saveToCouch
