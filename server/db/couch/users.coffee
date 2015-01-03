CONFIG = require 'config'
__ = CONFIG.root
_ = __.require 'builders', 'utils'

Promise = require 'bluebird'

# assembling different libraries to make a unique interface
# while I couldn't find the perfect promise-based lib
cot = __.require('couch', 'cot_base').users

designDocName = 'users'
viewMethods = __.require('couch', 'view_methods')(designDocName)
nano = __.require('couch', 'nano_base').use CONFIG.db.name('users')
nanoMethods =
  fetch: (keys)->
    if _.typeArray(keys)
      def = Promise.defer()
      if keys.length > 0
        params =
          keys: keys
          include_docs: true
        nano.fetch params, (err, body)->
          if err then def.reject new Error(err)
          else def.resolve _.mapCouchDoc(body)
      else def.resolve()
      return def.promise

module.exports = _.extend cot, viewMethods, nanoMethods