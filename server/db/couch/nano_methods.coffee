CONFIG = require 'config'
__ = CONFIG.root
_ = __.require 'builders', 'utils'

Promise = require 'bluebird'



fetch = (db, keys)->
  _.typeArray(keys)

  def = Promise.defer()

  if keys.length > 0
    params =
      keys: keys
      include_docs: true

    db.fetch params, (err, body)->
      if err then def.reject new Error(err)
      else def.resolve _.mapCouchDoc(body)

  else def.resolve()

  return def.promise


module.exports = (db)->
  return nanoMethods =
    fetch: fetch.bind null, db
