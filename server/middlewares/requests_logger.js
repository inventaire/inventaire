const CONFIG = require('config')
const { mutedDomains, mutedPath } = CONFIG.requestsLogger

// Adapted from https://github.com/expressjs/morgan 1.1.1
module.exports = (req, res, next) => {
  req._startAt = process.hrtime()

  const logRequest = () => {
    res.removeListener('finish', logRequest)
    res.removeListener('close', logRequest)
    if (skip(req, res)) return
    const line = format(req, res)
    if (line == null) return
    process.stdout.write(`${line}\n`)
  }

  res.on('finish', logRequest)
  res.on('close', logRequest)

  next()
}

const skip = (req, res) => {
  // /!\ resources behind the /public endpoint will have their pathname
  // with /public removed: /public/css/app.css will have a pathname=/css/app.css
  // Take the pathname on (req._parsedOriginalUrl or req._parsedUrl) instead
  // to work around it, if the need arise
  const { path, pathname } = req._parsedUrl
  const domain = pathname.split('/')[2]
  return mutedDomains.includes(domain) || mutedPath.includes(path)
}

const format = (req, res) => {
  const { method, originalUrl: url, user } = req
  const { statusCode: status } = res

  const color = statusCategoryColor[status.toString()[0]] || noColor
  const base = `\x1b[90m${method} ${url} \x1b[${color}m${status} \x1b[90m${responseTime(req, res)}ms`

  if (user) {
    return `${base} - u:${user._id}\x1b[0m`
  } else {
    return `${base}\x1b[0m`
  }
}

const statusCategoryColor = {
  5: 31, // red
  4: 33, // yellow
  3: 36, // cyan
  2: 32 // green
}

const noColor = 0

const responseTime = (req, res) => {
  if (res._header == null || req._startAt == null) return ''
  const [ seconds, nanoseconds ] = process.hrtime(req._startAt)
  const ms = (seconds * 1000) + (nanoseconds / 1000000)
  return ms.toFixed(3)
}
