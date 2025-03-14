import onlineReport from '#controllers/reports/online_report'
import { actionsControllersFactory } from '#lib/actions_controllers'
import { isNonEmptyString } from '#lib/boolean_validations'
import { newError } from '#lib/error/error'
import { bundleMissingBodyError } from '#lib/error/pre_filled'
import { isBotRequest } from '#lib/incoming_requests'
import { responses_ } from '#lib/responses'
import { logError } from '#lib/utils/logs'
import type { Req, Res } from '#types/server'

function cspReport (req: Req, res: Res) {
  const report = req.body['csp-report'] || req.body
  const err = buildError('csp report', report, req)
  logError(err, 'csp report')
  responses_.ok(res)
}

const ignoredBotErrorsPattern = /loading css chunk|failed to fetch/i

function errorReport (req: Req, res: Res) {
  const { error: errData } = req.body

  if (errData == null) {
    return bundleMissingBodyError(req, res, 'error')
  }

  const message = errData.message || 'client error'

  const err = buildError(message, errData, req)

  // Non-standard status codes used in reported errors
  // 599 = client implementation error
  // 598 = user abuse

  if (!(isBotRequest(req) && ignoredBotErrorsPattern.test(err.message))) {
    logError(err, 'client error report')
  }
  responses_.ok(res)
}

function buildError (message, errData, req) {
  const statusCode = errData.statusCode || 500
  const err = newError(message, statusCode, errData)
  if (errData.context) err.context = errData.context
  // Do not add an emitter stack on client reports as it makes it be confused
  // with the client error stack itself
  delete err.emitter
  err.stack = getErrStack(errData)
  // Prevent logging the stack trace twice
  if (err.context) delete err.context.stack
  err.referer = req.headers.referer
  err['user-agent'] = req.headers['user-agent']
  return err
}

function getErrStack (err) {
  let { message, stack = '' } = err
  // Adding the message at the top of the stack trace
  // as expected by logError that will log only the stack trace, assuming it
  // contains the error message too
  if (isNonEmptyString(message) && !stack.includes(message)) {
    stack = `${message}\n${stack}`
  }
  return stack
}

export default {
  post: actionsControllersFactory({
    public: {
      'csp-report': cspReport,
      'error-report': errorReport,
      online: onlineReport,
    },
  }),
}
