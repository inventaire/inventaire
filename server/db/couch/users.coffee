CONFIG = require 'config'
__ = CONFIG.root
_ = __.require 'builders', 'utils'

# assembling different libraries to make a unique interface
# while I couldn't find the perfect promise-based lib
cot = __.require('couch', 'cot_base').users

designDocName = 'users'
viewMethods = __.require('couch', 'view_methods')(designDocName)

dbName = CONFIG.db.name('users')
nanoMethods = __.require('couch', 'nano_base')(dbName)

module.exports = _.extend cot, viewMethods, nanoMethods