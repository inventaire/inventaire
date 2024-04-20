import util from 'node:util'
import { isArguments } from 'lodash-es'
import chalk, { red, grey } from 'tiny-chalk'
import { iscontextualizedError, type ContextualizedError } from '#lib/error/format_error'
import config from '#server/config'

const { offline, verbose } = config
// Log full objects
util.inspect.defaultOptions.depth = 20

let errorCount = 0
const countsByErrorStatusCode = {}

const print = (str: string) => process.stdout.write(str + '\n')

export const log = (obj: unknown, label?: string, color: string = 'cyan') => {
  if (!verbose) return
  if ((typeof obj === 'string') && (label == null)) {
    print(chalk[color](obj))
  } else {
    // converting arguments object to array for readablilty
    // @ts-ignore Using ignore as some environment (namely prod) gives "TS2578: Unused '@ts-expect-error' directive"
    if (isArguments(obj)) obj = Array.from(obj)
    if (label != null) {
      print(grey('****** ') + chalk[color](label.toString()) + grey(' ******'))
    } else {
      print(chalk[color]('******************************'))
    }
    if (typeof obj === 'object') {
      console.log(obj)
    } else {
      print(obj?.toString())
    }
    print(grey('-----'))
  }
}

export const success = (obj: unknown, label?: string) => log(obj, label, 'green')
export const info = (obj: unknown, label?: string) => log(obj, label, 'blue')
export function warn (err: unknown, label?: string) {
  if (iscontextualizedError(err)) {
    const url = err.context && err.context.url
    // Local 404 errors don't need to be logged, as they will be logged
    // by the request logger middleware and logging the error object is of no help,
    // everything is in the URL
    if (err.statusCode === 404 && url && url[0] === '/') return
  }
  if (err instanceof Error) {
    // shorten the stack trace
    err.stack = err.stack.split('\n').slice(0, 5).join('\n')
  }

  log(err, label, 'yellow')
}

export function logError (err: ContextualizedError, label?: string) {
  if (!(err instanceof Error)) {
    throw new Error('invalid error object')
  }

  // If the error is of a lower lever than 500, make it a warning, not an error
  if ((err.statusCode != null) && (err.statusCode < 500)) {
    return warn(err, label)
  }

  // Prevent logging big error stack traces for network errors
  // in offline development mode
  if (offline && (err.code === 'ENOTFOUND')) {
    log(err.message, `${label} (offline)`, 'red')
    return
  }

  log(err, label, 'red')

  const errorStatusCode = err.statusCode || 'no-status-code'
  countsByErrorStatusCode[errorStatusCode] = countsByErrorStatusCode[errorStatusCode] || 0
  countsByErrorStatusCode[errorStatusCode]++
  errorCount++
}

export function logErrorMessage (label?: string) {
  log(label, null, 'red')
}

const tapLogger = logger => label => obj => {
  logger(obj, label)
  return obj
}

export const Log = tapLogger(log)
export const LogError = tapLogger(logError)

const errorRethrow = (err: ContextualizedError, label?: string) => {
  logError(err, label)
  throw err
}

export const LogErrorAndRethrow = tapLogger(errorRethrow)

// logs the errors total if there was an error
// in the last 5 seconds
// -> just a convenience for debugging
export const logErrorsCount = () => {
  let prev = 0
  const counter = () => {
    if (errorCount !== prev) {
      prev = errorCount
      console.log(red('errors by status codes:'), countsByErrorStatusCode)
    }
  }
  setInterval(counter, 5000)
}
