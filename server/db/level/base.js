let DB, level
const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')
const { Promise } = __.require('lib', 'promises')
const error_ = __.require('lib', 'error/error')

const DBPathBase = __.path('leveldb')
const { suffix } = CONFIG.db
const DBPath = (suffix != null) ? `${DBPathBase}-${suffix}` : DBPathBase

const sublevel = require('level-sublevel')
if (CONFIG.leveldbMemoryBackend) {
  _.info('leveldb in memory')
  level = require('level-test')()
  DB = sublevel(level())
} else {
  level = require('level-party')
  const config = {}
  _.info(DBPath, 'leveldb path')
  DB = sublevel(level(DBPath, config))
}

const rawSubDb = (dbName, valueEncoding) => {
  _.success(`${dbName} opened`)
  return DB.sublevel(dbName, { valueEncoding })
}

// Promisified and with a few additional functions
const simpleSubDb = dbName => {
  const sub = Promise.promisifyAll(rawSubDb(dbName, 'json'))

  return {
    get: key => {
      return sub.getAsync(key)
      // TODO: remove to keep the convention that notFound cases
      // should be handled in catch functions
      .catch(error_.catchNotFound)
    },
    put: sub.putAsync.bind(sub),
    del: sub.delAsync.bind(sub),
    batch: sub.batchAsync.bind(sub),
    reset: Reset(sub),
    sub
  }
}

const Reset = sub => () => new Promise((resolve, reject) => {
  const ops = []
  return sub.createKeyStream()
  .on('data', key => ops.push({ type: 'del', key }))
  .on('end', () => sub.batch(ops, (err, res) => {
    if (err) reject(err)
    else resolve(res)
  }))
})

const Inspect = sub => () => streamPromise(sub.createReadStream())
.then(_.Log('sub dump'))

const streamPromise = stream => new Promise((resolve, reject) => {
  const results = []
  return stream
  .on('data', results.push.bind(results))
  .on('end', () => resolve(results))
  .on('error', reject)
})

module.exports = { rawSubDb, simpleSubDb, Reset, Inspect, streamPromise }
