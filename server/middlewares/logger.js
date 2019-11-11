CONFIG = require 'config'
{ mutedDomains, mutedPath } = CONFIG.morgan

# Adapted from https://github.com/expressjs/morgan 1.1.1
module.exports = (req, res, next)->
  req._startAt = process.hrtime()

  logRequest = ->
    res.removeListener 'finish', logRequest
    res.removeListener 'close', logRequest
    if skip req, res then return
    line = format req, res
    unless line? then return
    process.stdout.write line + '\n'

  res.on 'finish', logRequest
  res.on 'close', logRequest

  next()

skip = (req, res)->
  # /!\ resources behind the /public endpoint will have their pathname
  # with /public removed: /public/css/app.css will have a pathname=/css/app.css
  # Take the pathname on (req._parsedOriginalUrl or req._parsedUrl) instead
  # to work around it, if the need arise
  { path, pathname } = req._parsedUrl
  domain = pathname.split('/')[2]
  return domain in mutedDomains or path in mutedPath

format = (req, res)->
  { method, originalUrl: url, user } = req
  { statusCode: status } = res

  color = 0 # no color
  if (status >= 500) then color = 31 # red
  else if (status >= 400) then color = 33 # yellow
  else if (status >= 300) then color = 36 # cyan
  else if (status >= 200) then color = 32 # green

  base = "\x1b[90m#{method} #{url} \x1b[#{color}m#{status} \x1b[90m#{responseTime(req, res)}ms"

  if user? then "#{base} - u:#{user._id}\x1b[0m"
  else "#{base}\x1b[0m"

responseTime = (req, res)->
  unless res._header? and req._startAt? then return ''
  [ seconds, nanoseconds ] = process.hrtime req._startAt
  ms = seconds * 1000 + nanoseconds / 1000000
  return ms.toFixed(3)
