CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
follow = require 'follow'
meta = __.require 'lib', 'meta'

dbHost = CONFIG.db.fullHost()

module.exports = (params)->
  { dbBaseName } = params
  dbName = params.dbName = CONFIG.db.name dbBaseName

  meta.get buildKey(dbName)
  .then initFollow.bind(null, params)
  .catch _.ErrorRethrow('init follow err')

initFollow = (params, lastSeq=0)->
  { dbName, filter, onChange, reset } = params
  _.log lastSeq, "#{dbName} last seq"

  if reset then lastSeq = 0

  _.type lastSeq, 'number'

  config =
    db: "#{dbHost}/#{dbName}"
    include_docs: true
    filter: filter
    feed: 'continuous'
    since: lastSeq

  setLastSeq = SetLastSeq dbName

  follow config, (err, change)->
    if err? then _.error err, "#{dbName} follow err"
    else
      { seq } = change
      _.log seq, "#{dbName} change"
      setLastSeq seq
      onChange change


SetLastSeq = (dbName)->
  key = buildKey dbName
  # Creating a closure on dbName to underline that
  # this function shouldn't be shared between databases
  # as it could miss updates due to the debouncer
  setLastSeq = (seq)->
    meta.put key, seq
    .then -> _.log seq, "#{dbName} last seq updated"
    .catch _.Error("#{dbName} setLastSeq err")
  # setLastSeq might be triggered many times if a log of changes arrive at once
  # no need to write to the database at each times, just the last
  return _.debounce setLastSeq, 1000


buildKey = (dbName)-> "#{dbName}-last-seq"
