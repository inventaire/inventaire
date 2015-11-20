CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
Promise = require 'bluebird'
error_ = __.require 'lib', 'error/error'

DBPath = __.path 'leveldb', CONFIG.port

sublevel = require 'level-sublevel'
if CONFIG.env is 'tests'
  level = require('level-test')()
  DB = sublevel level()
else
  levelup = require 'levelup'
  leveldown = require 'leveldown'
  levelConfig =
    db: leveldown

  DB = sublevel levelup(DBPath, levelConfig)

module.exports =
  sub: (dbName)->
    _.success "#{dbName} openned"
    return DB.sublevel dbName

  promisified: (sub)->
    return Promise.promisifyAll sub

  unjsonized: (sub)->
    API =
      get: (key)->
        sub.getAsync(key)
        .catch error_.catchNotFound
        .then (res)-> if res? then JSON.parse(res)

      put: (key, value)-> sub.putAsync key, JSON.stringify(value)
      del: (key)-> sub.delAsync(key)
      batch: (ops)-> sub.batchAsync(ops)
      update: (key, value)-> @del(key).then ()=> @put(key, value)
      patch: (key, value)-> @get(key).then (current)=> @update key, _.extend(current, value)
      getStream: (params)->
        def = Promise.defer()
        result = []
        sub.createValueStream(params)
        .on 'data', (data)-> result.push JSON.parse(data)
        .on 'error', (err)-> def.reject new Error(err)
        .on 'end', (err)-> def.resolve result
        return def.promise
      reset: ->
        ops = []
        sub.createKeyStream()
        .on 'data', (key)-> ops.push {type: 'del', key: key}
        .on 'end', =>
          @batch(ops)
          .then -> _.log 'reset succesfully'
          .catch _.Error('reset failed')

    return API

  simpleAPI: (dbName)->
    sub = @sub(dbName)
    API = @unjsonized @promisified(sub)
    API.sub = sub
    return API