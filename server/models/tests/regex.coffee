CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
regex_ = __.require 'sharedLibs', 'regex'
ipRegex = require 'ip-regex'

module.exports = _.extend regex_,
  Lang: /^\w{2}(-\w{2})?$/
  Sha1: /^[0-9a-f]{40}$/
  StringNumber: /^[0-9]+(\.[0-9]+)?$/
  Ip: ipRegex {exact: true}
