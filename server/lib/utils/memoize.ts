// A small memoize implementation optimized for module initialization: when you call
// `import foo from './foo.js'` several times, it always returns the same value or object
// (see https://nodejs.org/docs/latest/api/esm.html#urls),
// but if the initialization is done by passing arguments to a function
// (ex: `fooFactory('bar')`) there is no caching mechanism, unless
// the  'fooFactory' module implements it. This memoize function thus aims to help
// implementing this caching mechanism easily:
//
// import { memoize } from '#lib/utils/memoize'
// const memoizedFn = memoize(fn)
// memoizedFn('a', 'b') === memoizedFn('a', 'b')
// memoizedFn('a', 'b') !== memoizedFn('a')
//
// See memoize unit tests for more details

export function memoize <A extends unknown[], T> (fn: (...args: A) => T) {
  const cache = {}
  return (...args: A) => {
    args = addUndefinedArguments(args, fn.length)
    const key = args.join('|')
    if (cache[key] == null) cache[key] = fn(...args)
    return cache[key] as T
  }
}

function addUndefinedArguments (args, fnLength) {
  const missingArgs = fnLength - args.length
  // Due to Function.length counting arguments before the first argument
  // with a defautl value, functions with default values called with those default
  // arguments defined will have more arguments than their length, thus missingArgs < 0
  if (missingArgs <= 0) return args
  else return args.concat(new Array(missingArgs))
}
