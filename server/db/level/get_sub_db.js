const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')
const memoize = __.require('lib', 'utils/memoize')
// Make sure to set the global Promise object to Bluebird
// before calling level libs, so that db functions return Bluebird promises
global.Promise = __.require('lib', 'promises').Promise

const dbFolderPathBase = __.path('leveldb')
const { suffix } = CONFIG.db
const dbFolderPath = suffix ? `${dbFolderPathBase}-${suffix}` : dbFolderPathBase

const sub = require('subleveldown')

let globalDb
if (CONFIG.leveldbMemoryBackend) {
  _.info('leveldb in memory')
  const level = require('level-test')()
  globalDb = level()
} else {
  const level = require('level-party')
  const config = {}
  _.info(dbFolderPath, 'leveldb path')
  globalDb = level(dbFolderPath, config)
}

module.exports = memoize((dbName, valueEncoding) => {
  valueEncoding = valueEncoding || 'json'
  _.success(`${dbName} opened`)
  return sub(globalDb, dbName, { valueEncoding })
})
