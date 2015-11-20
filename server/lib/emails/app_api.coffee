CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
root = CONFIG.fullPublicHost()

module.exports =
  img: __.require('sharedLibs', 'api/img')(_, root)
