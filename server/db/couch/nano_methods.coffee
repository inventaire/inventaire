CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
couch_ = __.require 'lib', 'couch'

Promise = require 'bluebird'

fetch = (db, keys)->
  _.typeArray keys
  return new Promise (resolve, reject)->
    unless keys.length > 0 then resolve()

    params =
      keys: keys
      include_docs: true

    db.fetch params, (err, body)->
      if err? then reject new Error(err)
      else resolve couch_.mapDoc(body)

module.exports = (db)->
  return nanoMethods =
    fetch: fetch.bind null, db
