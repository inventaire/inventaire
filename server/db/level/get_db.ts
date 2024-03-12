import { absolutePath } from '#lib/absolute_path'
import { info } from '#lib/utils/logs'
import config from '#server/config'

const dbFolder = absolutePath('root', 'db')
const { suffix } = config.db
const { inMemoryLRUCacheSize } = config.leveldb
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

const { default: levelParty } = await import('level-party')
const level = levelParty
info(generalDbFolderPath, 'general leveldb path')
info(cacheDbFolderPath, 'cache leveldb path')
export const generalDb = level(generalDbFolderPath, leveldownOptions)
export const cacheDb = level(cacheDbFolderPath, leveldownOptions)
