#!/usr/bin/env node
const CONFIG = require('config')
const __ = CONFIG.universalPath

const dbFolderPathBase = __.path('root', 'db/leveldb')
const { suffix } = CONFIG.db
const { inMemoryLRUCacheSize } = CONFIG.leveldb
const dbFolderPath = suffix ? `${dbFolderPathBase}-${suffix}` : dbFolderPathBase

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

const level = require('level-party')
const db = level(dbFolderPath, leveldownOptions)

const logStatus = () => console.log(new Date().toISOString(), JSON.stringify({ status: db.db.status, suffix, dbFolderPath }))

setTimeout(logStatus, 1000)
// Just to prevent the process from exiting and the db object to be garbage collected
setInterval(logStatus, 100000)
