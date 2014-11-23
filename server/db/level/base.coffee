CONFIG = require 'config'
__ = CONFIG.root
_ = __.require 'builders', 'utils'

Promise = require 'bluebird'

module.exports =
  raw: (dbName)->
    if CONFIG.env is 'tests'
      level = require('level-test')()
      leveldb = level()
    else
      _.typeString dbName
      level = require 'level'
      dbPath = __.path 'leveldb', dbName
      leveldb = level(dbPath)

    return leveldb

  promisified: (db)->
    return Promise.promisifyAll db

  unjsonized: (db)->
    API =
      get: (key)-> db.getAsync(key).then JSON.parse
      put: (key, value)-> db.putAsync key, JSON.stringify(value)
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
    db = @raw(dbName)
    API = @unjsonized @promisified(db)
    API.raw = db
    return API