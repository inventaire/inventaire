CONFIG = require 'config'
__ = CONFIG.root
_ = __.require 'builders', 'utils'

Promise = require 'bluebird'

nano = __.require('db', 'nano_base').use CONFIG.db.users
cot = __.require('db', 'cot_base').users


# assembling different libraries to make a unique interface
# while I couldn't find the perfect promise-based lib

module.exports =
  get: cot.get.bind cot
  post: cot.post.bind cot
  put: cot.put.bind cot
  del: cot.delete.bind cot
  view: cot.view.bind cot
  viewCustom: (viewName, params)->
    @view('users', viewName, params)
    .then _.mapCouchDoc.bind(_)
  viewByKey: (viewName, key)->
    params =
      key: key
      include_docs: true
    @viewCustom viewName, params
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