CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
requests_ = __.require 'lib', 'requests'
allDbsUrl = CONFIG.db.fullHost() + '/_all_dbs'

module.exports = (suffix)->
  requests_.get allDbsUrl
  .filter isMatchingDatabase(suffix)

isMatchingDatabase = (suffix)->
  patternString = if suffix? then "^\\w+-#{suffix}$" else '^\\w+$'
  dbNamePattern = new RegExp patternString

  return (dbName)->
    # Filtering-out _replicator and _users
    if dbName[0] is '_' then return false
    return dbName.match dbNamePattern
