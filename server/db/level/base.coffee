CONFIG = require 'config'
__ = CONFIG.root
_ = __.require 'builders', 'utils'

module.exports = (dbName)->
  if CONFIG.env is 'tests'
    level = require('level-test')()
    leveldb = level()
  else
    if _.typeString dbName
      level = require 'level'
      dbPath = __.path 'leveldb', dbName
      leveldb = level(dbPath)

  return leveldb