CONFIG = require 'config'
__ = CONFIG.root

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
  fetch: (keys)->
    def = Promise.defer()
    if keys.length > 0
      nano.fetch {keys: keys}, (err, body)->
        if err then def.reject new Error(err)
        else def.resolve body
    else def.resolve()
    return def.promise