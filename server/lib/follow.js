// A module to listen for changes in a CouchDB database, and dispatch the change
// event to all the subscribed followers
const CONFIG = require('config')
const _ = require('builders/utils')
const { wait } = require('lib/promises')
const assert_ = require('lib/utils/assert_types')
const error_ = require('lib/error/error')
const follow = require('cloudant-follow')
const metaDb = require('db/level/get_sub_db')('meta', 'utf8')
const requests_ = require('lib/requests')
const dbHost = CONFIG.db.fullHost()
const { reset: resetFollow, delay: delayFollow } = CONFIG.db.follow

// Working around the circular dependency
let waitForCouchInit
const lateRequire = () => { waitForCouchInit = require('db/couchdb/init') }
setTimeout(lateRequire, 0)

// Never follow in non-server mode.
// This behaviors allows, in API tests environement, to have the tests server
// following, while scripts being called directly by tests don't compete
// with the server
const freezeFollow = CONFIG.db.follow.freeze || !CONFIG.serverMode

// filter and an onChange functions register, indexed per dbBaseNames
const followers = {}

module.exports = async params => {
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

    const lastSeq = await getLastSeq(dbName)
    // Then start follow this database
    // after a bit, to let other followers the time to register, and CouchDB
    // the time to initialize, while letting other initialization functions
    // with a higher priority level some time to run.
    // It won't miss any changes as CouchDB will send everything that happened since
    // the last saved sequence number
    await wait(delayFollow)
    await initFollow(dbName, reset, lastSeq)
  }
}

const getLastSeq = async dbName => {
  if (resetFollow) return
  const key = buildKey(dbName)
  return metaDb.get(key).catch(error_.catchNotFound)
}

const initFollow = async (dbName, reset, lastSeq) => {
  if (lastSeq != null) assert_.string(lastSeq)

  const setLastSeq = SetLastSeq(dbName)
  const dbUrl = `${dbHost}/${dbName}`

  await waitForCouchInit()
  const dbLastSeq = await getDbLastSeq(dbUrl)

  // If there is a legitimate large gap, use a dedicated script based on CouchDB current state
  // rather than attempt to follow from the beginning.
  // Typical case: when starting the server with a large entities database and an empty Elasticsearch,
  // the recommended process is to load entities in Elasticsearch by using scripts/indexation/load.js
  if (getSeqPrefixNumber(dbLastSeq) > getSeqPrefixNumber(lastSeq) + 10000) {
    _.log({ lastSeq, dbLastSeq }, `${dbName} saved last_seq is too far beyond: ignoring`, 'yellow')
    lastSeq = dbLastSeq
  }

  // Reset lastSeq if the dbLastSeq is behind
  // as this probably means the database was deleted and re-created
  // and the leveldb-backed meta db kept the last_seq value of the previous db
  if (getSeqPrefixNumber(lastSeq) > getSeqPrefixNumber(dbLastSeq)) {
    _.log({ lastSeq, dbLastSeq }, `${dbName} saved last_seq ahead of db: reseting`, 'yellow')
    lastSeq = null
  }

  setLastSeq(lastSeq)

  await resetIfNeeded(lastSeq, reset)
  return startFollowingDb({ dbName, dbUrl, lastSeq, setLastSeq })
}

// CouchDB documentation states that applications "should treat seq ids as opaque values"
// https://docs.couchdb.org/en/stable/whatsnew/2.0.html
// but it seems that seq prefixes remain incremental integers
const getSeqPrefixNumber = seq => seq ? parseInt(seq.split('-')[0]) : 0

const resetIfNeeded = async (lastSeq, reset) => {
  if (reset != null && lastSeq == null) return reset()
}

const startFollowingDb = params => {
  const { dbName, dbUrl, lastSeq, setLastSeq } = params
  const dbFollowers = followers[dbName]

  const config = {
    db: dbUrl,
    include_docs: true,
    feed: 'continuous',
    since: lastSeq || 0
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
  const setLastSeq = async seq => {
    try {
      if (seq != null) await metaDb.put(key, seq)
      else await metaDb.del(key)
    } catch (err) {
      _.error(err, `${dbName} setLastSeq err (seq: ${seq})`)
    }
  }
  // setLastSeq might be triggered many times if a log of changes arrive at once
  // no need to write to the database at each times, just the last
  return _.debounce(setLastSeq, 1000)
}

const buildKey = dbName => `${dbName}-last-seq`

const getDbLastSeq = async dbUrl => {
  const { last_seq: lastSeq } = await requests_.get(`${dbUrl}/_changes?limit=0&descending=true`)
  return lastSeq
}
