// A module to listen for changes in a CouchDB database, and dispatch the change
// event to all the subscribed followers
const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')
const promises_ = __.require('lib', 'promises')
const assert_ = __.require('utils', 'assert_types')
const follow = require('follow')
const meta = __.require('lib', 'meta')
const breq = require('bluereq')
const dbHost = CONFIG.db.fullHost()
const { reset: resetFollow, delay: delayFollow } = CONFIG.db.follow

// Never follow in non-server mode.
// This behaviors allows, in API tests environement, to have the tests server
// following, while scripts being called directly by tests don't compete
// with the server
const freezeFollow = CONFIG.db.follow.freezeFollow || !CONFIG.serverMode

// filter and an onChange functions register, indexed per dbBaseNames
const followers = {}

module.exports = params => {
  const { dbBaseName, filter, onChange, reset } = params
  assert_.string(dbBaseName)
  assert_.function(filter)
  assert_.function(onChange)
  if (reset != null) assert_.function(reset)

  const dbName = CONFIG.db.name(dbBaseName)

  if (freezeFollow) {
    _.warn(dbName, 'freezed follow')
    return
  }

  if (followers[dbName]) {
    // Add this follower to the exist db follower register
    return followers[dbName].push(params)
  } else {
    // Create a db follower register, and add it this follower
    followers[dbName] = [ params ]

    // Then start follow this database
    return meta.get(buildKey(dbName))
    // after a bit, to let other followers the time to register, and CouchDB
    // the time to initialize, while letting other initialization functions
    // with a higher priority level some time to run.
    // It won't miss any changes as CouchDB will send everything that happened since
    // the last saved sequence number
    .delay(delayFollow)
    .then(initFollow(dbName, reset))
    .catch(_.ErrorRethrow('init follow err'))
  }
}

const initFollow = (dbName, reset) => (lastSeq = 0) => {
  if (resetFollow) lastSeq = 0
  assert_.number(lastSeq)

  const setLastSeq = SetLastSeq(dbName)
  const dbUrl = `${dbHost}/${dbName}`

  return getDbLastSeq(dbUrl)
  .then(dbLastSeq => {
    // Reset lastSeq if the dbLastSeq is behind
    // as this probably means the database was deleted and re-created
    // and the leveldb-backed meta db kept the last_seq value of the previous db
    if (lastSeq > dbLastSeq) {
      _.log({ lastSeq, dbLastSeq }, `${dbName} saved last_seq ahead of db: reseting`, 'yellow')
      lastSeq = 0
      setLastSeq(lastSeq)
    }

    return resetIfNeeded(dbName, lastSeq, reset)
    .then(() => startFollowingDb({ dbName, dbUrl, lastSeq, setLastSeq }))
  })
}

const resetIfNeeded = (dbName, lastSeq, reset) => {
  if (lastSeq === 0 && reset != null) {
    return reset()
  } else {
    return promises_.resolve()
  }
}

const startFollowingDb = params => {
  const { dbName, dbUrl, lastSeq, setLastSeq } = params
  const dbFollowers = followers[dbName]

  const config = {
    db: dbUrl,
    include_docs: true,
    feed: 'continuous',
    since: lastSeq
  }

  return follow(config, (err, change) => {
    if (err != null) return _.error(err, `${dbName} follow err`)
    setLastSeq(change.seq)
    for (const follower of dbFollowers) {
      if (follower.filter(change.doc)) {
        follower.onChange(change)
      }
    }
  })
}

const SetLastSeq = dbName => {
  const key = buildKey(dbName)
  // Creating a closure on dbName to underline that
  // this function shouldn't be shared between databases
  // as it could miss updates due to the debouncer
  const setLastSeq = seq => {
    return meta.put(key, seq)
    .catch(_.Error(`${dbName} setLastSeq err`))
  }
  // setLastSeq might be triggered many times if a log of changes arrive at once
  // no need to write to the database at each times, just the last
  return _.debounce(setLastSeq, 1000)
}

const buildKey = dbName => `${dbName}-last-seq`

const getDbLastSeq = dbUrl => {
  return breq.get(`${dbUrl}/_changes?limit=0&descending=true`)
  .get('body')
  .get('last_seq')
}
