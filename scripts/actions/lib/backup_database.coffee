# If the need arise to use CONFIG directly, make sure to use get_custom_config
# to be in lined with scripts/actions/backup_databases
__ = require('config').universalPath
_ = __.require 'builders', 'utils'
assert_ = __.require 'utils', 'assert_types'
execa = require 'execa'

module.exports = (params, dbName)->
  args = buildArgsArray params, dbName

  execa 'couchdb-backup', args
  .then (res)->
    _.log res.stdout, "#{dbName} stdout"
    _.warn res.stderr, "#{dbName} stderr"

# Depends on 'couchdb-backup' (from https://github.com/danielebailo/couchdb-dump)
# being accessible from the $PATH
buildArgsArray = (params, dbName)->
  { host, port, username, password, backupFolder } = params
  assert_.strings [ host, username, password, dbName, backupFolder ]
  assert_.type 'number|string', port

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
