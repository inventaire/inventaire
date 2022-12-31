import assert_ from 'lib/utils/assert_types'

export default ({ fn, ttlAfterFunctionCallReturned }) => {
  assert_.function(fn)
  assert_.number(ttlAfterFunctionCallReturned)
  const cache = {}
  return async (...args) => {
    if (args.length !== 1) throw new Error('only single argument functions are supported')
    const arg = args[0]
    if (cache[arg] != null) {
      return cache[arg]
    } else {
      try {
        const promise = fn(arg)
        cache[arg] = promise
        const res = await promise
        setTimeout(() => delete cache[arg], ttlAfterFunctionCallReturned)
        return res
      } catch (err) {
        setTimeout(() => delete cache[arg], ttlAfterFunctionCallReturned)
        throw err
      }
    }
  }
}
