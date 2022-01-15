const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = require('builders/utils')
const memoize = require('lib/utils/memoize')
const assert_ = require('lib/utils/assert_types')

const dbFolderPathBase = __.path('root', 'db/leveldb')
const { suffix } = CONFIG.db
const { inMemoryLRUCacheSize, memoryBackend } = CONFIG.leveldb
const dbFolderPath = suffix ? `${dbFolderPathBase}-${suffix}` : dbFolderPathBase

const sub = require('subleveldown')

// See https://github.com/Level/leveldown#options
const leveldownOptions = {
  cacheSize: inMemoryLRUCacheSize,

  // Default is 1024, which causes 'WriteError: "Too many open files"' errors in production
  // Setting it to Infinity lets the operating system fully manage the process limit.
  // The operating system limit of opened files per process should itself be increased
  // as it might also have a low defaults:
  //
  //  echo '* soft nofile 65536\n* hard nofile 65536\n' | sudo tee -a /etc/security/limits.conf
  //
  // (see https://singztechmusings.wordpress.com/2011/07/11/ulimit-how-to-permanently-set-kernel-limits-in-linux/)
  //
  // Additionnaly, the process itself should be given a higher limit
  // See https://github.com/inventaire/inventaire-deploy/commit/0ad6e2a
  // This limit can be checked by inspecting `cat /proc/${pid}/limits | grep 'Max open files'`
  maxOpenFiles: Infinity
}

let globalDb
if (memoryBackend) {
  _.warn('leveldb in memory')
  const level = require('level-test')()
  globalDb = level()
} else {
  const level = require('level')
  _.info(dbFolderPath, 'leveldb path')
  globalDb = level(dbFolderPath, leveldownOptions)
}

// Available encodings: https://github.com/Level/codec#builtin-encodings
module.exports = memoize((dbName, valueEncoding) => {
  assert_.string(dbName)
  assert_.string(valueEncoding)
  return sub(globalDb, dbName, { valueEncoding })
})
