
const CONFIG = require('config')
const { mutedDomains, mutedPath } = CONFIG.morgan

// Adapted from https://github.com/expressjs/morgan 1.1.1
module.exports = (req, res, next) => {
  req._startAt = process.hrtime()

  const logRequest = () => {
    res.removeListener('finish', logRequest)
    res.removeListener('close', logRequest)
    if (skip(req, res)) return
    const line = format(req, res)
    if (line == null) return
    return process.stdout.write(`${line}\n`)
  }

  res.on('finish', logRequest)
  res.on('close', logRequest)

  return next()
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

  let color = 0 // no color
  if (status >= 500) {
    color = 31 // red
  } else if (status >= 400) {
    color = 33 // yellow
  } else if (status >= 300) {
    color = 36 // cyan
  } else if (status >= 200) { color = 32 } // green

  const base = `\x1b[90m${method} ${url} \x1b[${color}m${status} \x1b[90m${responseTime(req, res)}ms`

  if (user != null) {
    return `${base} - u:${user._id}\x1b[0m`
  } else {
    return `${base}\x1b[0m`
  }
}

const responseTime = (req, res) => {
  if ((res._header == null) || (req._startAt == null)) return ''
  const [ seconds, nanoseconds ] = Array.from(process.hrtime(req._startAt))
  const ms = (seconds * 1000) + (nanoseconds / 1000000)
  return ms.toFixed(3)
}
