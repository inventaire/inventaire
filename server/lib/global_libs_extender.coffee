__ = require('config').universalPath

module.exports = ->
  __.require('sharedLibs', 'global_libs_extender')()