CONFIG = require 'config'
__ = require('config').universalPath
_ = __.require 'builders', 'utils'

analytics_ = __.require 'controllers', 'analytics/lib/base'

# HOW TO:

# if POSTed report object as a navigation object => recordSession
# report isnt logged, just temporary stocked in LevelDB
# until the session is over and the report is transfered to CouchDB

# if POSTed report object as an error object => logErrorIfNew
# it can be the same report

module.exports =
  reports: (req, res, next)->
    { navigation, error } = req.body
    cspReport = req.body['csp-report']

    if navigation? then analytics_.recordSession(req)
    if error?
      _.forceArray(error).map (err)->
        analytics_.logErrorIfNew(err, req.body)

    if cspReport?
      _.error cspReport, 'cspReport'

    unless navigation? or error? or cspReport?
      _.error [req.url, req.headers, req.body], 'wrongly formatted client report'

    res.send('ok')
