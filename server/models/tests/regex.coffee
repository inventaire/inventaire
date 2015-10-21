CONFIG = require 'config'
__ = CONFIG.root
_ = __.require 'builders', 'utils'
regex_ = __.require 'sharedLibs', 'regex'


module.exports = _.extend regex_,
  Lang: /^\w{2}(-\w{2})?$/
  Sha1: /^[0-9a-f]{40}$/
