import parseUrl from 'parseurl'
import { coloredElapsedTime } from '#lib/time'
import config from '#server/config'

const host = config.getPublicOrigin()
const { mutedDomains, mutedPath } = config.requestsLogger

// Adapted from https://github.com/expressjs/morgan 1.1.1
export default (req, res, next) => {
  req._startAt = process.hrtime()

  res.on('close', () => {
    if (skip(req)) return
    logRequest(req, res)
  })

  next()
}

function skip (req) {
  // /!\ resources behind the /public endpoint will have their pathname
  // with /public removed: /public/css/app.css will have a pathname=/css/app.css
  // In that case, req._parsedOriginalUrl would be defined to the original /public/css/app.css,
  // but it's also fine to just set 'css' or 'js' as muted domains instead
  const { path, pathname } = parseUrl(req)
  const domain = pathname.split('/')[1]
  return mutedDomains.includes(domain) || mutedPath.includes(path)
}

function logRequest (req, res) {
  const { method, originalUrl: url, user } = req
  const { statusCode: status, finished } = res

  const color = statusCategoryColor[status.toString()[0]]

  // res.finished is set to true once the 'finished' event was fired
  // See https://nodejs.org/api/http.html#http_event_finish
  // Interruption typically happen when the client closes the request,
  // for instance when tests timeout
  const interrupted = finished ? '' : ` ${yellow}CLOSED BEFORE FINISHING`

  let line = `${grey}${method} ${url} ${color}${status}${interrupted} ${grey}${coloredElapsedTime(req._startAt)}${grey}`

  if (user) line += ` - u:${user._id}`

  const { origin } = req.headers
  // Log cross-site requests origin
  if (origin != null && origin !== host) line += ` - origin:${origin}`

  if (status === 302) {
    const location = res.get('location')
    line += ` ${cyan}=> ${grey}${location}`
  }

  line += resetColors
  process.stdout.write(`${line}\n`)
}

// Using escape codes rather than chalk to save a few characters per line
const escape = '\x1b['
const resetColors = `${escape}0m`
const red = `${escape}31m`
const green = `${escape}32m`
const yellow = `${escape}33m`
const cyan = `${escape}36m`
const grey = `${escape}90m`

const statusCategoryColor = {
  5: red,
  4: yellow,
  3: cyan,
  2: green,
  undefined: resetColors,
}
