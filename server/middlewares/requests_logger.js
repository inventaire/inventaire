const CONFIG = require('config')
const { coloredElapsedTime } = require('lib/time')
const host = CONFIG.fullPublicHost()
const { mutedDomains, mutedPath } = CONFIG.requestsLogger

// Adapted from https://github.com/expressjs/morgan 1.1.1
module.exports = (req, res, next) => {
  req._startAt = process.hrtime()

  res.on('close', () => {
    if (skip(req, res)) return
    const line = format(req, res)
    if (line == null) return
    process.stdout.write(`${line}\n`)
  })

  next()
}

const skip = (req, res) => {
  // /!\ resources behind the /public endpoint will have their pathname
  // with /public removed: /public/css/app.css will have a pathname=/css/app.css
  // In that case, req._parsedOriginalUrl would be defined to the original /public/css/app.css,
  // but it's also fine to just set 'css' or 'js' as muted domains instead
  const { path, pathname } = req._parsedUrl
  const domain = pathname.split('/')[1]
  return mutedDomains.includes(domain) || mutedPath.includes(path)
}

const format = (req, res) => {
  const { method, originalUrl: url, user } = req
  const { statusCode: status, finished } = res

  const color = statusCategoryColor[status.toString()[0]]

  // res.finished is set to true once the 'finished' event was fired
  // See https://nodejs.org/api/http.html#http_event_finish
  // Interruption typically happen when the client closes the request,
  // for instance when tests timeout
  const interrupted = finished ? '' : ' \x1b[33mCLOSED BEFORE FINISHING'

  let line = `\x1b[90m${method} ${url} \x1b[${color}m${status}${interrupted} \x1b[90m${coloredElapsedTime(req._startAt)}`

  if (user) line += ` - u:${user._id}`

  const { origin } = req.headers
  // Log cross-site requests origin
  if (origin != null && origin !== host) line += `\x1b[90m - origin:${origin}`

  return `${line}\x1b[0m`
}

const statusCategoryColor = {
  5: 31, // red
  4: 33, // yellow
  3: 36, // cyan
  2: 32, // green
  undefined: 0, // no color
}
