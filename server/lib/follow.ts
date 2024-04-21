// A module to listen for changes in a CouchDB database, and dispatch the change
// event to all the subscribed followers
import follow from 'cloudant-follow'
import { debounce } from 'lodash-es'
import type { DbName } from '#db/couchdb/databases'
import { waitForCouchInit } from '#db/couchdb/init'
import metaDbFactory from '#db/level/get_sub_db'
import { catchNotFound } from '#lib/error/error'
import { wait } from '#lib/promises'
import { requests_ } from '#lib/requests'
import { serverMode } from '#lib/server_mode'
import { assert_ } from '#lib/utils/assert_types'
import { log, warn, logError } from '#lib/utils/logs'
import config from '#server/config'
import type { Url } from '#types/common'

const metaDb = metaDbFactory('meta', 'utf8')
const dbHost = config.db.getOrigin() as Url
const { reset: resetFollow, delay: delayFollow } = config.db.follow

type DatabaseSeq = `${number}-{string}`

// Never follow in non-server mode.
// This behaviors allows, in API tests environement, to have the tests server
// following, while scripts being called directly by tests don't compete
// with the server
const freezeFollow = config.db.follow.freeze || !serverMode

// filter and an onChange functions register, indexed per dbBaseNames
const followers = {}

export default async function (params) {
  const { dbBaseName, filter, onChange, reset } = params
  assert_.string(dbBaseName)
  assert_.function(filter)
  assert_.function(onChange)
  if (reset != null) assert_.function(reset)

  const dbName = config.db.name(dbBaseName)

  if (freezeFollow) {
    warn(dbName, 'freezed follow')
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

async function getLastSeq (dbName) {
  if (resetFollow) return
  const key = buildKey(dbName)
  return metaDb.get(key).catch(catchNotFound)
}

const initFollow = async (dbName: DbName, reset: () => Promise<void>, lastSeq: DatabaseSeq) => {
  if (lastSeq != null) assert_.string(lastSeq)

  const setLastSeq = SetLastSeq(dbName)
  const dbUrl = `${dbHost}/${dbName}` as Url

  await waitForCouchInit()
  const dbLastSeq = await getDbLastSeq(dbUrl)

  // If there is a legitimate large gap, use a dedicated script based on CouchDB current state
  // rather than attempt to follow from the beginning.
  // Typical case: when starting the server with a large entities database and an empty Elasticsearch,
  // the recommended process is to load entities in Elasticsearch by using scripts/indexation/load.js
  if (getSeqPrefixNumber(dbLastSeq) > getSeqPrefixNumber(lastSeq) + 10000) {
    log({ lastSeq, dbLastSeq }, `${dbName} saved last_seq is too far beyond: ignoring`, 'yellow')
    lastSeq = dbLastSeq
  }

  // Reset lastSeq if the dbLastSeq is behind
  // as this probably means the database was deleted and re-created
  // and the leveldb-backed meta db kept the last_seq value of the previous db
  if (getSeqPrefixNumber(lastSeq) > getSeqPrefixNumber(dbLastSeq)) {
    log({ lastSeq, dbLastSeq }, `${dbName} saved last_seq ahead of db: reseting`, 'yellow')
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

async function resetIfNeeded (lastSeq, reset) {
  if (reset != null && lastSeq == null) return reset()
}

function startFollowingDb (params) {
  const { dbName, dbUrl, lastSeq, setLastSeq } = params
  const dbFollowers = followers[dbName]

  const config = {
    db: dbUrl,
    include_docs: true,
    feed: 'continuous',
    since: lastSeq || 0,
  }

  return follow(config, (err, change) => {
    if (err != null) return logError(err, `${dbName} follow err`)
    setLastSeq(change.seq)
    for (const follower of dbFollowers) {
      if (follower.filter(change.doc)) {
        follower.onChange(change)
      }
    }
  })
}

function SetLastSeq (dbName: DbName) {
  const key = buildKey(dbName)
  // Creating a closure on dbName to underline that
  // this function shouldn't be shared between databases
  // as it could miss updates due to the debouncer
  async function setLastSeq (seq) {
    try {
      if (seq != null) await metaDb.put(key, seq)
      else await metaDb.del(key)
    } catch (err) {
      logError(err, `${dbName} setLastSeq err (seq: ${seq})`)
    }
  }
  // setLastSeq might be triggered many times if a log of changes arrive at once
  // no need to write to the database at each times, just the last
  return debounce(setLastSeq, 1000)
}

const buildKey = (dbName: DbName) => `${dbName}-last-seq`

async function getDbLastSeq (dbUrl: Url) {
  const { last_seq: lastSeq } = await requests_.get(`${dbUrl}/_changes?limit=0&descending=true`)
  return lastSeq as DatabaseSeq
}
