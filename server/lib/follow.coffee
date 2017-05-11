# A module to listen for changes in a CouchDB database, and dispatch the change
# event to all the subscribed followers

CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
follow = require 'follow'
meta = __.require 'lib', 'meta'
dbHost = CONFIG.db.fullHost()
{ freezeFollow, resetFollow } = CONFIG.db

# filter and an onChange functions register, indexed per dbBaseNames
followers = {}

module.exports = (params)->
  { dbBaseName, filter, onChange } = params
  _.types [ dbBaseName, filter, onChange ], [ 'string', 'function', 'function' ]

  dbName = CONFIG.db.name dbBaseName

  if freezeFollow
    _.warn dbName, 'freezed follow'
    return

  if followers[dbName]?
    # Add this follower to the exist db follower register
    followers[dbName].push params
  else
    # Create a db follower register, and add it this follower
    followers[dbName] = [ params ]

    # Then start follow this database
    meta.get buildKey(dbName)
    # after a bit, to let other followers the time to register, and CouchDB
    # the time to initialize, while letting other initialization functions
    # with a higher priority level some time to run
    .delay 5000
    .then initFollow(dbName)
    .catch _.ErrorRethrow('init follow err')

initFollow = (dbName)-> (lastSeq=0)->
  if resetFollow then lastSeq = 0
  _.log lastSeq, "#{dbName} last seq"
  _.type lastSeq, 'number'

  config =
    db: "#{dbHost}/#{dbName}"
    include_docs: true
    feed: 'continuous'
    since: lastSeq

  setLastSeq = SetLastSeq dbName

  follow config, (err, change)->
    if err? then _.error err, "#{dbName} follow err"
    else
      { seq } = change
      _.log seq, "#{dbName} change"
      setLastSeq seq
      for follower in followers[dbName]
        if follower.filter(change.doc) then follower.onChange change

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
