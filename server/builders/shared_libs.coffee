__ = require('config').universalPath
module.exports = (name)-> __.require 'sharedLibs', name
