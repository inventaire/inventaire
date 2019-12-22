// A small memoize implementation optimized for module initialization: when you call
// `require('./foo')` several times, it always returns the same value or object
// (see https://nodejs.org/docs/latest-v8.x/api/modules.html#modules_require_cache),
// but if the initialization is done by passing arguments to a function
// (ex: `require('./foo')('bar')`) there is no caching mechanism, unless
// the  './foo' module implements it. This memoize function thus aims to help
// implementing this caching mechanism easily

module.exports = fn => {
  const cache = {}
  return (...args) => {
    args = addUndefinedArguments(args, fn.length)
    const key = args.join('|')
    if (cache[key] == null) cache[key] = fn(...args)
    return cache[key]
  }
}

const addUndefinedArguments = (args, fnLength) => {
  const missingArgs = fnLength - args.length
  return args.concat(new Array(missingArgs))
}
