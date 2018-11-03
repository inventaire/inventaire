# A module to listen for changes in a CouchDB database, and dispatch the change
# event to all the subscribed followers

CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
follow = require 'follow'
meta = __.require 'lib', 'meta'
breq = require 'bluereq'
dbHost = CONFIG.db.fullHost()
{ reset:resetFollow, freeze:freezeFollow, delay:delayFollow } = CONFIG.db.follow

# Never follow in non-server mode.
# This behaviors allows, in API tests environement, to have the tests server
# following, while scripts being called directly by tests don't compete
# with the server
freezeFollow = freezeFollow or not CONFIG.serverMode

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
    .delay delayFollow
    .then initFollow(dbName)
    .catch _.ErrorRethrow('init follow err')

initFollow = (dbName)-> (lastSeq = 0)->
  if resetFollow then lastSeq = 0
  _.type lastSeq, 'number'

  setLastSeq = SetLastSeq dbName
  dbUrl = "#{dbHost}/#{dbName}"

  getDbLastSeq dbUrl
  .then (dbLastSeq)->
    # Reset lastSeq if the dbLastSeq is behind
    # as this probably means the database was deleted and re-created
    # and the leveldb-backed meta db kept the last_seq value of the previous db
    if lastSeq > dbLastSeq
      _.log { lastSeq, dbLastSeq }, "#{dbName} saved last_seq ahead of db: reseting", 'yellow'
      lastSeq = 0
      setLastSeq lastSeq

    config =
      db: dbUrl
      include_docs: true
      feed: 'continuous'
      since: lastSeq

    follow config, (err, change)->
      if err? then return _.error err, "#{dbName} follow err"

      { seq } = change
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
    .catch _.Error("#{dbName} setLastSeq err")
  # setLastSeq might be triggered many times if a log of changes arrive at once
  # no need to write to the database at each times, just the last
  return _.debounce setLastSeq, 1000

buildKey = (dbName)-> "#{dbName}-last-seq"

getDbLastSeq = (dbUrl)->
  breq.get "#{dbUrl}/_changes?limit=0&descending=true"
  .get 'body'
  .get 'last_seq'
