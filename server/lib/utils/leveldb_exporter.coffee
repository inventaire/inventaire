level = require 'level'
sublevel = require 'level-sublevel'
__ = require('config').root
_ = __.require 'builders', 'utils'

module.exports =
  dumpDb: (name)->
    db = findDb(name)
    unless db? then throw 'cant find db'

    dump = {};

    db.createReadStream()
    .on 'data', (data)->
        console.log(data)
        dump[data.key] = data.value
    .on 'close', ->
      date = new Date().toISOString().split('T')[0]
      path = "./#{dbName}"
      path += "-#{subName}" if subName?
      path += "-#{date}.json"
      _.info "writing to #{path}"
      _.jsonWrite dump, path

  copyFromTo: (fromDbName, toDbName)->
    fromDb = findDb(fromDbName)
    toDb = findDb(toDbName)

    fromDb.createReadStream()
    .on 'data', (data)->
        console.log(data)
        toDb.put data.key, data.value
    .on 'close', -> _.success 'done!'


findDb = (name)->
  unless name? then throw 'missing name';
  [ dbName, subName ] = name.split ':'

  dbPath = __.path 'leveldb', dbName
  if subName?
    db = sublevel level(dbPath)
    return db.sublevel subName
  else
    return level(dbPath)
