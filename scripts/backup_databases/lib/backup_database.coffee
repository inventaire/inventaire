CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
assert_ = __.require 'utils', 'assert_types'
execa = require 'execa'
{ backupFolder } = require('./get_backup_folder_data')()
{ username, password, host, port } = CONFIG.db

module.exports = (dbName)->
  args = buildArgsArray backupFolder, dbName

  execa 'couchdb-backup', args
  .then (res)->
    _.log res.stdout, "#{dbName} stdout"
    _.warn res.stderr, "#{dbName} stderr"

# Depends on 'couchdb-backup' (from https://github.com/danielebailo/couchdb-dump)
# being accessible from the $PATH
buildArgsArray = (backupFolder, dbName)->
  outputFile = "#{backupFolder}/#{dbName}.json"

  return [
    # Common parameters
    '-b' # backup mode
    '-H', host
    '-P', port
    '-u', username
    '-p', password
    # Database-specific
    '-d', dbName
    '-f', outputFile
  ]
