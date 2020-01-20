const CONFIG = require('config')
const { offline } = CONFIG
const loggers_ = require('inv-loggers')
const chalk = require('chalk')
const { grey, red } = chalk

let errorCounter = 0

// Log full objects
require('util').inspect.defaultOptions.depth = 20

const BaseLogger = (color, operation) => (obj, label) => {
  // fully display deep objects
  console.log(grey('****') + chalk[color](`${label}`) + grey('****'))
  console.log(operation(obj))
  console.log(grey('----------'))
  return obj
}

module.exports = _ => {
  if (CONFIG.verbosity === 0) { loggers_.log = _.identity }

  const stringify = BaseLogger('yellow', JSON.stringify)

  const customLoggers = {
    stringify,

    error: (err, label, logStack = true) => {
      if (!(err instanceof Error)) {
        throw new Error('invalid error object')
      }

      if (err._hasBeenLogged) return

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

      loggers_.log(_.omit(err, 'stack'), label, 'red')
      if (logStack) {
        // Make the stack more readable
        err.stack = err.stack.split('\n')
        // Log the stack appart to make it be displayed with line breaks
        console.log(err.stack)
      }

      if (!err.labels) { err.labels = 'server' }

      err._hasBeenLogged = true
      errorCounter++
    },

    warn: (err, label) => {
      // Errors that have a status code of 404 don't need to be logged
      // as they will be logged by the request logger middleware (morgan)
      // and logging the error object is of no help, everything is in the URL
      if (err._hasBeenLogged || (err.statusCode === 404)) return
      if (err instanceof Error) {
        // shorten the stack trace
        err.stack = err.stack.split('\n').slice(0, 3).join('\n')
      }

      loggers_.warn(err, label)
      err._hasBeenLogged = true
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
    },

    startTimer: key => {
      console.time(chalk.magenta(key))
      // Make sure to return the non-formated key
      return key
    },

    // To be used in promise chains
    StartTimer: key => data => {
      customLoggers.startTimer(key)
      return data
    },

    EndTimer: key => data => {
      console.timeEnd(chalk.magenta(key))
      return data
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
