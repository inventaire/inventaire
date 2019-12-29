const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')
const memoize = __.require('lib', 'utils/memoize')
const assert_ = __.require('utils', 'assert_types')
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

// Available encodings: https://github.com/Level/codec#builtin-encodings
module.exports = memoize((dbName, valueEncoding) => {
  assert_.string(dbName)
  assert_.string(valueEncoding)
  _.success(`${dbName} opened`)
  return sub(globalDb, dbName, { valueEncoding })
})
