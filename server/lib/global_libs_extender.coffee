__ = require('config').root

module.exports = ->
  __.require('sharedLibs', 'global_libs_extender')()