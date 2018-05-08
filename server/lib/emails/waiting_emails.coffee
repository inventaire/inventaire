# a sub-level database to keep tracks of waiting emails
__ = require('config').universalPath
levelBase = __.require 'level', 'base'
module.exports = levelBase.simplifiedSubDb 'waiting'
