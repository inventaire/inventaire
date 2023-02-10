import { pick } from 'lodash-es'
import { objLength } from '#lib/utils/base'
import { warn, logError } from '#lib/utils/logs'
import { typeOf } from '#lib/utils/types'

const headersToKeep = [ 'user-agent', 'content-type', 'content-length', 'referer' ]

let responses_
const importCircularDependencies = async () => {
  ;({ responses_ } = await import('#lib/responses'))
}
setImmediate(importCircularDependencies)

export default function (req, res, err) {
  // only accepts Error instances
  if (!(err instanceof Error)) {
    logError(err, 'bad error object')
    res.status(500).send(err)
    return
  }

  // if a status code was attached to the error, use it
  const statusCode = err.statusCode || 500

  err.user = pick(req.user, '_id', 'username')
  err.headers = pick(req.headers, headersToKeep)

  // Ex: to pass req.query as err.context, set err.attachReqContext = 'query'
  if (err.attachReqContext && emptyContext(err.context)) {
    err.context = pick(req, err.attachReqContext)
  }

  if (err.mute !== true) {
    if (statusCode.toString().startsWith('4')) {
      warn(err, statusCode)
    } else {
      logError(err, err.message)
    }
  }

  if (err.context) {
    // Prevent returning authorization headers from an internal requests that would have failed
    // such as requests to CouchDB
    delete err.context.headers
  }

  res.status(statusCode)
  responses_.send(res, {
    status: statusCode,
    status_verbose: err.message,
    error_type: err.error_type,
    error_name: err.error_name,
    context: err.context,
  })
}

const emptyContext = context => {
  if (context == null) return true
  const type = typeOf(context)
  if (type === 'array' || type === 'string') return context.length === 0
  else if (type === 'object') return objLength(context) === 0
  else return true
}
