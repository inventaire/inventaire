const __ = require('config').universalPath
const _ = __.require('builders', 'utils')
const responses_ = __.require('lib', 'responses')
const headersToKeep = [ 'user-agent', 'content-type', 'content-length', 'referer' ]

module.exports = (req, res, err, status) => {
  // only accepts Error instances
  if (!(err instanceof Error)) {
    _.error(err, 'bad error object')
    return res.status(500).send(err)
  }

  // if a status code was attached to the error, use it
  const statusCode = err.statusCode || 500

  err.user = _.pick(req.user, '_id', 'username')
  err.headers = _.pick(req.headers, headersToKeep)

  // Ex: to pass req.query as err.context, set err.attachReqContext = 'query'
  if (err.attachReqContext && emptyContext(err.context)) {
    err.context = _.pick(req, err.attachReqContext)
  }

  if (/^4/.test(statusCode)) {
    _.warn(err, statusCode)
  } else {
    _.error(err, err.message)
  }

  res.status(statusCode)
  responses_.send(res, {
    status: statusCode,
    status_verbose: err.message,
    error_type: err.error_type,
    error_name: err.error_name,
    context: err.context
  })
}

const emptyContext = context => {
  if ((context == null)) return true
  switch (_.typeOf(context)) {
  case 'array': case 'string': return context.length === 0
  case 'object': return _.objLength(context) === 0
  default: return true
  }
}
