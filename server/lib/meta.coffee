# a sub-level database to persist data on the application state
# that can be retrieved after the app restarts
__ = require('config').universalPath
levelBase = __.require 'level', 'base'
module.exports = levelBase.simplifiedSubDb 'meta'
