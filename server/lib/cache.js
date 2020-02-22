const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')
const error_ = __.require('lib', 'error/error')
const assert_ = __.require('utils', 'assert_types')
const db = __.require('level', 'get_sub_db')('cache', 'json')
const { offline } = CONFIG
const { oneDay, oneMonth } = __.require('lib', 'times')

module.exports = {
  // - key: the cache key
  // - fn: a function with its context and arguments binded
  // - timespan: maximum acceptable age of the cached value in ms
  // - refresh: alias for timespan=0
  // - dry: return what's in cache or nothing: if the cache is empty, do not call the function
  // - dryFallbackValue: the value to return when no cached value can be found, to keep responses
  //   type consistent
  get: async params => {
    const { key, fn, refresh, dryFallbackValue } = params
    let { timespan, dry, dryAndCache } = params

    if (refresh) {
      timespan = 0
      dry = false
      dryAndCache = false
    }
    if (timespan == null) timespan = oneMonth
    if (dry == null) dry = false
    if (dryAndCache == null) dryAndCache = false

    try {
      assert_.string(key)
      if (!dry) {
        assert_.function(fn)
        assert_.number(timespan)
      }
    } catch (err) {
      throw error_.new(err, 500)
    }

    // Try to avoid cache miss when making a dry get
    // or when working offline (only useful in development)
    if (dry || offline) timespan = Infinity

    // When passed a 0 timespan, it is expected to get a fresh value.
    // Refusing the old value is also a way to invalidate the current cache
    const refuseOldValue = timespan === 0

    return checkCache(key, timespan)
    .then(requestOnlyIfNeeded(key, fn, dry, dryAndCache, dryFallbackValue, refuseOldValue))
    .catch(err => {
      const label = `final cache_ err: ${key}`
      // not logging the stack trace in case of 404 and alikes
      if (/^4/.test(err.statusCode)) _.warn(err, label)
      else _.error(err, label)
      throw err
    })
  },

  put: async (key, value) => {
    if (!_.isNonEmptyString(key)) throw error_.new('invalid key', 500)
    if (value == null) throw error_.new('missing value', 500)
    return putResponseInCache(key, value)
  }
}

const checkCache = (key, timespan) => {
  return db.get(key)
  .catch(error_.catchNotFound)
  .then(res => {
    // Returning nothing will trigger a new request
    if (res == null) return
    const { body, timestamp } = res
    // Reject outdated cached values
    if (!isFreshEnough(timestamp, timespan)) return
    // In case there was nothing in cache
    if (_.isEmpty(body)) {
      // Prevent re-requesting if it was already retried lately
      if (isFreshEnough(timestamp, 2 * oneDay)) {
        // _.info(key, 'empty cache value: retried lately')
        return res
      }
      // Otherwise, trigger a new request by returning nothing
      // _.info(key, 'empty cache value: retrying')
    } else {
      return res
    }
  })
}

const requestOnlyIfNeeded = (key, fn, dry, dryAndCache, dryFallbackValue, refuseOldValue) => cached => {
  if (cached != null) {
    // _.info(`from cache: ${key}`)
    return cached.body
  }

  if (dry) {
    // _.info(`empty cache on dry get: ${key}`)
    return dryFallbackValue
  }

  if (dryAndCache) {
    // _.info(`returning and populating cache: ${key}`)
    populate(key, fn, refuseOldValue)
    .catch(_.Error(`dryAndCache: ${key}`))
    return dryFallbackValue
  }

  return populate(key, fn, refuseOldValue)
}

const populate = (key, fn, refuseOldValue) => {
  return fn()
  .then(res => {
    // _.info(`from remote data source: ${key}`)
    putResponseInCache(key, res)
    return res
  })
  .catch(err => {
    if (refuseOldValue) {
      _.warn(err, `${key} request err (returning nothing)`)
    } else {
      _.warn(err, `${key} request err (returning old value)`)
      return returnOldValue(key, err)
    }
  })
}

const putResponseInCache = (key, res) => {
  // _.info(`caching ${key}`)
  return db.put(key, {
    body: res,
    timestamp: new Date().getTime()
  })
}

const isFreshEnough = (timestamp, timespan) => !_.expired(timestamp, timespan)

const returnOldValue = (key, err) => {
  return checkCache(key, Infinity)
  .then(res => {
    if (res != null) {
      return res.body
    } else {
      // rethrowing the previous error as it's probably more meaningful
      err.old_value = null
      throw err
    }
  })
}
