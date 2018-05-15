CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
{ Promise } = __.require 'lib', 'promises'
error_ = __.require 'lib', 'error/error'

DBPath = __.path 'leveldb'

sublevel = require 'level-sublevel'
if CONFIG.leveldbMemoryBackend
  level = require('level-test')()
  DB = sublevel level()
else
  level = require 'level-party'
  config = {}
  DB = sublevel level(DBPath, config)

rawSubDb = (dbName, valueEncoding)->
  _.success "#{dbName} opened"
  return DB.sublevel dbName, { valueEncoding }

# Promisified and with a few additional functions
simpleSubDb = (dbName)->
  sub = Promise.promisifyAll rawSubDb(dbName, 'json')

  return API =
    get: (key)->
      sub.getAsync key
      # TODO: remove to keep the convention that notFound cases
      # should be handled in catch functions
      .catch error_.catchNotFound
    put: sub.putAsync.bind sub
    del: sub.delAsync.bind sub
    batch: sub.batchAsync.bind sub
    reset: Reset sub
    sub: sub

Reset = (sub)-> ()->
  new Promise (resolve, reject)->
    ops = []
    sub.createKeyStream()
    .on 'data', (key)-> ops.push { type: 'del', key }
    .on 'end', ->
      sub.batch ops, (err, res)->
        if err then reject err
        else resolve res

Inspect = (sub)-> ()->
  streamPromise sub.createReadStream()
  .then _.Inspect('sub dump')

streamPromise = (stream)->
  new Promise (resolve, reject)->
    results = []
    stream
    .on 'data', results.push.bind(results)
    .on 'end', -> resolve results
    .on 'error', reject

module.exports = { rawSubDb, simpleSubDb, Reset, Inspect, streamPromise }
