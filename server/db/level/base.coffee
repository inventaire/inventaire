CONFIG = require 'config'
__ = CONFIG.root
_ = __.require 'builders', 'utils'

Promise = require 'bluebird'

sublevel = require 'level-sublevel'
dbPath = __.path 'leveldb', 'main'

if CONFIG.env is 'tests'
  level = require('level-test')()
  DB = sublevel level()
else
  level = require 'level'
  DB = sublevel level(dbPath)

module.exports =
  db: DB
  sub: (dbName)-> DB.sublevel dbName

  promisified: (db)->
    return Promise.promisifyAll db

  unjsonized: (db)->
    API =
      get: (key)-> db.getAsync(key).then JSON.parse
      put: (key, value)-> db.putAsync key, JSON.stringify(value)
      del: (key)-> db.delAsync(key)
      update: (key, value)-> @del(key).then ()=> @put(key, value)
      patch: (key, value)-> @get(key).then (current)=> @update key, _.extend(current, value)
      getStream: (params)->
        def = Promise.defer()
        result = []
        db.createValueStream(params)
        .on 'data', (data)-> result.push JSON.parse(data)
        .on 'error', (err)-> def.reject new Error(err)
        .on 'end', (err)-> def.resolve result
        return def.promise

    return API

  simpleAPI: (dbName)->
    sub = @sub(dbName)
    API = @unjsonized @promisified(sub)
    API.sub = sub
    return API