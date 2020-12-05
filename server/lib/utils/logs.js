const CONFIG = require('config')
const { offline, verbose } = CONFIG
const loggers_ = require('inv-loggers')
const chalk = require('chalk')
const { grey, red } = chalk

let errorCounter = 0

// Log full objects
require('util').inspect.defaultOptions.depth = 20

const print = str => process.stdout.write(str + '\n')

const BaseLogger = (color, operation) => (obj, label) => {
  // fully display deep objects
  print(grey('****') + chalk[color](`${label}`) + grey('****'))
  print(operation(obj))
  print(grey('----------'))
  return obj
}

module.exports = _ => {
  if (!verbose) loggers_.log = _.identity

  const stringify = BaseLogger('yellow', JSON.stringify)

  const customLoggers = {
    stringify,

    error: (err, label) => {
      if (!(err instanceof Error)) {
        throw new Error('invalid error object')
      }

      // If the error is of a lower lever than 500, make it a warning, not an error
      if ((err.statusCode != null) && (err.statusCode < 500)) {
        return customLoggers.warn(err, label)
      }

      // Prevent logging big error stack traces for network errors
      // in offline development mode
      if (offline && (err.code === 'ENOTFOUND')) {
        loggers_.log(err.message, `${label} (offline)`, 'red')
        return
      }

      loggers_.log(err, label, 'red')

      errorCounter++
    },

    warn: (err, label) => {
      const url = err.context && err.context.url
      // Local 404 errors don't need to be logged, as they will be logged
      // by the request logger middleware and logging the error object is of no help,
      // everything is in the URL
      if (err.statusCode === 404 && url && url[0] === '/') return
      if (err instanceof Error) {
        // shorten the stack trace
        err.stack = err.stack.split('\n').slice(0, 3).join('\n')
      }

      loggers_.warn(err, label)
    },

    errorCount: () => errorCounter,

    // logs the errors total if there was an error
    // in the last 5 seconds
    // -> just a convenience for debugging
    logErrorsCount: () => {
      let prev = 0
      const counter = () => {
        if (errorCounter !== prev) {
          prev = errorCounter
          return console.log(red('errors: ') + errorCounter)
        }
      }
      setInterval(counter, 5000)
    }
  }

  // The same as inv-loggers::errorRethrow but using customLoggers.error instead
  const errorRethrow = (err, label) => {
    customLoggers.error(err, label)
    throw err
  }

  // Overriding inv-loggers partial loggers with the above customized loggers
  customLoggers.Warn = loggers_.partialLogger(customLoggers.warn)
  customLoggers.Error = loggers_.partialLogger(customLoggers.error)
  customLoggers.ErrorRethrow = loggers_.partialLogger(errorRethrow)

  // overriding inv-loggers 'error' and 'warn'
  return Object.assign({}, loggers_, customLoggers)
}
