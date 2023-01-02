import CONFIG from 'config'
import levelParty from 'level-party'
import levelTest from 'level-test'
import _ from '#builders/utils'
import { absolutePath } from '#lib/absolute_path'

const dbFolder = absolutePath('root', 'db')
const { suffix } = CONFIG.db
const { inMemoryLRUCacheSize, memoryBackend } = CONFIG.leveldb
const generalDbPathBase = `${dbFolder}/leveldb`
const cacheDbPathBase = `${dbFolder}/leveldb_cache`
const generalDbFolderPath = suffix ? `${generalDbPathBase}-${suffix}` : generalDbPathBase
const cacheDbFolderPath = suffix ? `${cacheDbPathBase}-${suffix}` : cacheDbPathBase

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
  maxOpenFiles: Infinity,
}

export let generalDb
export let cacheDb

if (memoryBackend) {
  _.warn('leveldb in memory')
  const level = levelTest()
  generalDb = level()
  cacheDb = level()
} else {
  const level = levelParty
  _.info(generalDbFolderPath, 'general leveldb path')
  _.info(cacheDbFolderPath, 'cache leveldb path')
  generalDb = level(generalDbFolderPath, leveldownOptions)
  cacheDb = level(cacheDbFolderPath, leveldownOptions)
}
