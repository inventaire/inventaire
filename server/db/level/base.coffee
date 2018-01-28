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
        return new Promise (resolve, reject)->
          result = []
          sub.createValueStream params
          .on 'data', (data)-> result.push JSON.parse(data)
          .on 'error', reject
          .on 'end', -> resolve result

      reset: ->
        ops = []
        sub.createKeyStream()
        .on 'data', (key)-> ops.push { type: 'del', key }
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