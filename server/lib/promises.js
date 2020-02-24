const CONFIG = require('config')
const __ = CONFIG.universalPath

// Working around the circular dependency
let _
const lateRequire = () => { _ = __.require('builders', 'utils') }
setTimeout(lateRequire, 0)

// Here should be the only direct require of bluebird
// so that every other dependency to it passed through this file
// and get the associated configuration
// Exception: cases when this policy would produce dependecy loops
const Promise = require('bluebird')
Promise.config(CONFIG.bluebird)

const wait = ms => new Promise(resolve => setTimeout(resolve, ms))

module.exports = {
  Promise,
  try: Promise.try,
  props: Promise.props,

  // skip throws in a standard way to be catched later
  // by catchSkip and not be treated as an error.
  // It can be used to pass over steps of a promise chain
  // made unnecessary for some reason
  skip: (reason, context) => {
    const err = new Error('skip')
    err.skip = true
    err.reason = reason
    err.context = context
    throw err
  },

  catchSkip: label => err => {
    if (err.skip) return _.log(err.context, `${label} skipped: ${err.reason}`)
    else throw err
  },

  // a proxy to Bluebird Promisify that keeps the names
  promisify: (modul, keys) => {
    // Allow to pass an array of the desired keys
    // or let keys undefined to get all the keys
    if (!_.isArray(keys)) keys = Object.keys(modul)
    const API = {}
    for (const key of keys) {
      API[key] = Promise.promisify(modul[key])
    }
    return API
  },

  // Source: http://bluebirdjs.com/docs/api/deferred-migration.html
  defer: () => {
    // Initialized in the defer function scope
    let resolveFn, rejectFn

    const promise = new Promise((resolve, reject) => {
      // Set the previously initialized variables
      // to the promise internal resolve/reject functions
      resolveFn = resolve
      rejectFn = reject
    })

    return {
      // A function to resolve the promise at will:
      // the promise will stay pending until 'resolve' or 'reject' is called
      resolve: resolveFn,
      reject: rejectFn,
      // The promise object, still pending at the moment this is returned
      promise
    }
  },

  wait,

  Wait: ms => async res => {
    await wait(ms)
    return res
  }
}
