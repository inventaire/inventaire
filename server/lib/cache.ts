import { promisify } from 'node:util'
import levelTtl from 'level-ttl'
import { leveldbFactory } from '#db/level/get_sub_db'
import { isNonEmptyString } from '#lib/boolean_validations'
import { newError, catchNotFound } from '#lib/error/error'
import { assert_ } from '#lib/utils/assert_types'
import { forceArray } from '#lib/utils/base'
import { warn, logError, LogError } from '#lib/utils/logs'
import config from '#server/config'

const cacheDb = leveldbFactory('cache', 'utf8')

const { ttlCheckFrequency, defaultCacheTtl } = config.leveldb
const db = levelTtl(cacheDb, { checkFrequency: ttlCheckFrequency, defaultTTL: defaultCacheTtl })
const dbPut = promisify(db.put)
const dbBatch = promisify(db.batch)
const dbGetMany = promisify(db.getMany.bind(db))
// It's convenient in tests to have the guaranty that the cached value was saved
// but in production, that means delaying API responses in case LevelDB writes get slow
const alwaysWaitForSavedValue = config.env.startsWith('tests')

export const cache_ = {
  // - key: the cache key
  // - fn: a function with its context and arguments binded
  // - refresh: force a cache miss
  // - dry: return what's in cache or nothing: if the cache is empty, do not call the function
  // - dryFallbackValue: the value to return when no cached value can be found, to keep responses
  //   type consistent
  // - ttl: customize how long the cached data should be kept before being deleted
  get: async <T> ({ key, fn, refresh, dry, dryFallbackValue, ttl = defaultCacheTtl }: { key: string, fn: () => Promise<T>, refresh?: boolean, dry?: boolean, dryFallbackValue?: T, ttl?: number }): Promise<T> => {
    if (refresh) {
      dry = false
    }
    if (dry == null) dry = false

    assert_.string(key)
    if (fn || !dry) assert_.function(fn)

    try {
      const cachedValue = refresh ? null : await checkCache(key)
      return await requestOnlyIfNeeded(key, cachedValue, fn, dry, dryFallbackValue, ttl)
    } catch (err) {
      const label = `final cache_ err: ${key}`
      // not logging the stack trace in case of 404 and alikes
      if (err.statusCode?.toString().startsWith('4')) warn(err, label)
      else logError(err, label)
      throw err
    }
  },

  dryGetMany: async (keys: string[]) => {
    return dbGetMany(keys)
  },

  put: async (key, value, ttl = defaultCacheTtl) => {
    if (!isNonEmptyString(key)) throw newError('invalid key', 500)
    if (value == null) throw newError('missing value', 500)
    return putValue(key, value, { ttl })
  },

  batchPut: async (entries: [ string, string ][]) => {
    const batch = entries.map(([ key, value ]) => ({ type: 'put', key, value }))
    return dbBatch(batch)
  },

  batchDelete: keys => {
    const batch = forceArray(keys).map(key => ({ type: 'del', key }))
    return dbBatch(batch)
  },
}

async function checkCache (key) {
  return db.get(key)
  .catch(catchNotFound)
}

function requestOnlyIfNeeded (key, cachedValue, fn, dry, dryFallbackValue, ttl) {
  if (cachedValue != null) {
    // info(`from cache: ${key}`)
    return JSON.parse(cachedValue)
  }

  if (dry) {
    // info(`empty cache on dry get: ${key}`)
    return dryFallbackValue
  }

  return populate(key, fn, ttl)
}

async function populate (key, fn, ttl) {
  const res = await fn()
  // info(`from remote data source: ${key}`)
  await putValue(key, res, { ttl, waitWrite: false })
  return res
}

async function putValue (key, value, { ttl, waitWrite = true }) {
  // undefined can not be stringified
  if (value === undefined) value = null
  // Run JSON.stringify/JSON.parse rather than using level valueEncoding=json option
  // to be able to store null values and avoid `[WriteError]: value cannot be `null` or `undefined``
  const storedValue = JSON.stringify(value)
  if (alwaysWaitForSavedValue || waitWrite) {
    return dbPut(key, storedValue, { ttl })
  } else {
    dbPut(key, storedValue, { ttl })
    // Failing to put the response in cache should not crash the process
    // as it is not critical: operations will continue without cache
    // everything will just be slower
    // Known case of WriteError: when "Too many open files"
    // Solutions:
    //   - restart process
    //   - increase leveldown `maxOpenFiles` option (see https://github.com/Level/leveldown#options)
    .catch(LogError(`cache populate err: ${key}`))
  }
}
