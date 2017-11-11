CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
{ authReq } = require '../utils/utils'
randomString = __.require 'lib', './utils/random_string'
endpointBase = '/api/groups?action'

createGroup = (name)-> authReq 'post', "#{endpointBase}=create", { name }

groupPromise = createGroup 'my group' + randomString(5)

module.exports = { endpointBase, groupPromise }
