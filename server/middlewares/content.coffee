CONFIG = require 'config'
__ = CONFIG.universalPath
error_ = __.require 'lib', 'error/error'

urlencoded = 'application/x-www-form-urlencoded'

module.exports =
  # When passed content with a content-type header different
  # from 'application/json' (typically urlencoded which is set by default on
  # tools like curl), this tries to be convenient by recovering the passed json
  # instead of returning an unhelpful error messages
  recoverValidJson: (req, res, next)->
    if req.headers['content-type'] isnt urlencoded then return next()

    keys = Object.keys req.body

    # keeping the case when req.body was parsed by body-parser as something like:
    # { '{"a":"b", "c":null}': '' }
    if keys.length isnt 1 or keys[0][0..1] isnt '{"' then return next()

    # if keys.length isnt 1 or req.body[keys[0]] isnt '' then return next()

    # try to parse what should be a valid json object
    try
      req.body = JSON.parse keys[0]
      next()
    # if it doesn't work, let it go
    catch err
      error_.bundle res, """
        Couldn't recover JSON data sent with "Content-Type: #{urlencoded}".
        Try using a "Content-Type: application/json" header instead
        """, 400
