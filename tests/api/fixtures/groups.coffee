CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
{ authReq, authReqB, getUserB } = require '../utils/utils'
faker = require 'faker'
endpointBase = '/api/groups'
endpointAction = endpointBase + '?action'

getGroup = (groupId)->
  authReq 'get', "#{endpointAction}=by-id&id=#{groupId}"
  .get 'group'

createGroup = (name)-> authReq 'post', "#{endpointBase}?action=create", { name }

membershipAction = (reqFn, action, groupId, userId)->
  reqFn 'put', endpointBase, { action, group: groupId, user: userId }

groupName = -> faker.lorem.word() + ' group'

# Resolves to a group with userA as admin and userB as member
groupPromise = createGroup groupName()
  .then (group)->
    membershipAction authReqB, 'request', group._id
    .then -> getUserB()
    .then (userB)->
      membershipAction authReq, 'accept-request', group._id, userB._id
    # Return the group doc
    .then -> getGroup group._id

module.exports = { endpointBase, endpointAction, groupPromise, getGroup, groupName }
