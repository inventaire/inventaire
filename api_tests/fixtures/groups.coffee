CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
{ authReq } = require '../utils/utils'
randomString = __.require 'lib', './utils/random_string'

name = 'my group' + randomString(5)
endpointBase = '/api/groups?action'

createGroup = authReq 'post', "#{endpointBase}=create", { name }

module.exports = { endpointBase, createGroup }
