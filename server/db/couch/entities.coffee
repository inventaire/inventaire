CONFIG = require('config')
__ = CONFIG.root
_ = __.require 'builders', 'utils'
cot = __.require('couch', 'cot_base').entities

designDocName = 'entities'
viewMethods = __.require('couch', 'view_methods')(designDocName)

module.exports = _.extend cot, viewMethods