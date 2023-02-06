import _ from '#builders/utils'
import onlineReport from '#controllers/reports/online_report'
import ActionsControllers from '#lib/actions_controllers'
import { error_ } from '#lib/error/error'
import { responses_ } from '#lib/responses'
import { logError } from '#lib/utils/logs'

const cspReport = (req, res) => {
  const report = req.body['csp-report'] || req.body
  const err = buildError('csp report', 'csp', report, req)
  logError(err, 'csp report')
  responses_.ok(res)
}

const errorReport = (req, res) => {
  const { error: errData } = req.body

  if (errData == null) {
    return error_.bundleMissingBody(req, res, 'error')
  }

  const message = errData.message || 'client error'

  const err = buildError(message, 'client error report', errData, req)
  logError(err, 'client error report')
  responses_.ok(res)
}

const buildError = (message, labels, errData, req) => {
  const statusCode = errData.statusCode || 500
  const err = error_.new(message, statusCode, errData)
  // Do not add an emitter stack on client reports as it makes it be confused
  // with the client error stack itself
  delete err.emitter
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
  // as expected by logError that will log only the stack trace, assuming it
  // contains the error message too
  if (_.isNonEmptyString(message) && (stack.search(message) === -1)) {
    stack = `${message}\n${stack}`
  }
  return stack
}

export default {
  post: ActionsControllers({
    public: {
      'csp-report': cspReport,
      'error-report': errorReport,
      online: onlineReport,
    },
  }),
}
