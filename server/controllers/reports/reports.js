

// Fix any style issues and re-enable lint.
const __ = require('config').universalPath
const _ = __.require('builders', 'utils')
const ActionsControllers = __.require('lib', 'actions_controllers')
const error_ = __.require('lib', 'error/error')
const responses_ = __.require('lib', 'responses')

const cspReport = (req, res) => {
  const { 'csp-report': errData } = req.body

  if (errData == null) {
    return error_.bundleMissingBody(req, res, 'csp-report')
  }

  const err = buildError('csp report', 'csp', errData, req)
  _.error(err, 'csp report', false)
  return responses_.ok(res)
}

const errorReport = (req, res) => {
  const { error: errData } = req.body

  if (errData == null) {
    return error_.bundleMissingBody(req, res, 'error')
  }

  const message = errData.message || 'client error'

  const err = buildError(message, 'client error report', errData, req)
  _.error(err, 'client error report')
  return responses_.ok(res)
}

const buildError = (message, labels, errData, req) => {
  const context = _.omit(errData, 'stack')
  const statusCode = errData.statusCode || 500
  const err = error_.new(message, statusCode, context)
  // Do not add an emitter stack on client reports as it makes it be confused
  // with the client error stack itself
  delete err.emitter
  // Labels to be used by gitlab-logging
  err.labels = labels
  err.stack = getErrStack(errData)
  err.referer = req.headers.referer
  err['user-agent'] = req.headers['user-agent']
  return err
}

// Faking an error object for the needs of server/lib/utils/open_issue.js
// Define the stack first to stringify only what was reported
const getErrStack = err => {
  let { message, stack } = err
  stack = err.stack || JSON.stringify(err, null, 2)
  // Adding the message at the top of the stack trace
  // as expected by _.error that will log only the stack trace, assuming it
  // contains the error message too
  if (_.isNonEmptyString(message) && (stack.search(message) === -1)) {
    stack = `${message}\n${stack}`
  }
  return stack
}

module.exports = {
  post: ActionsControllers({
    public: {
      'csp-report': cspReport,
      'error-report': errorReport,
      online: require('./online_report')
    }
  })
}
