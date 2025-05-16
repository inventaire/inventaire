import { resolve } from 'node:path'
import level from 'level-party'
import { projectRoot } from '#lib/absolute_path'
import { assertReadWriteAccess } from '#lib/fs'
import { info } from '#lib/utils/logs'
import config from '#server/config'

// Resolve relatively to the project root, unless it's an absolute path
const leveldbPathBase = resolve(projectRoot, config.leveldb.directory)

await assertReadWriteAccess(leveldbPathBase)

const { suffix } = config.db
const { inMemoryLRUCacheSize } = config.leveldb
const generalDbDirectoryPath = suffix ? `${leveldbPathBase}-${suffix}` : leveldbPathBase

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
  // Additionally, the process itself should be given a higher limit
  // See https://git.inventaire.io/inventaire-deploy/commit/0ad6e2a
  // This limit can be checked by inspecting `cat /proc/${pid}/limits | grep 'Max open files'`
  maxOpenFiles: Infinity,
}

info(generalDbDirectoryPath, 'leveldb path')
export const generalDb = level(generalDbDirectoryPath, leveldownOptions)
