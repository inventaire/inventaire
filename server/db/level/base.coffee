CONFIG = require 'config'
__ = CONFIG.root
_ = __.require 'builders', 'utils'
Promise = require 'bluebird'


mainDBPath = __.path 'leveldb', 'main'
secondaryDBPath = __.path 'leveldb', 'secondary'

sublevel = require 'level-sublevel'
if CONFIG.env is 'tests'
  level = require('level-test')()
  mainDB = secondaryDB = sublevel level()
else
  levelup = require 'levelup'
  leveldown = require 'leveldown'
  levelConfig =
    db: leveldown

  mainDB = sublevel levelup(mainDBPath, levelConfig)
  secondaryDB = sublevel levelup(secondaryDBPath, levelConfig)

module.exports =
  sub: (dbName, replicated)->
    if replicated
      _.success "#{dbName}: replicated"
      mainDB.sublevel dbName
    else
      _.warn "#{dbName}: not replicated"
      secondaryDB.sublevel dbName

  promisified: (sub)->
    return Promise.promisifyAll sub

  unjsonized: (sub)->
    API =
      get: (key)-> sub.getAsync(key).then JSON.parse
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
          .catch (err)-> _.error err, 'reset failed'

    return API

  simpleAPI: (dbName)->
    sub = @sub(dbName)
    API = @unjsonized @promisified(sub)
    API.sub = sub
    return API