CONFIG = require 'config'
__ = CONFIG.root
_ = __.require 'builders', 'utils'
promises_ = __.require 'lib', 'promises'
error_ = __.require 'lib', 'error/error'
Group = __.require 'models', 'group'


db = __.require('couch', 'base')('users', 'groups')

module.exports =
  # using a view to avoid returning users or relations
  byId: db.viewFindOneByKey.bind(db, 'byId')
  byUser: db.viewByKey.bind(db, 'byUser')
  create: (name, creatorId)->
    group = Group.create name, creatorId
    _.log group, 'group created'
    db.postAndReturn group

  findUserGroupsCoMembers: (userId)->
    @byUser userId
    .then allGroupsMembers


allGroupsMembers = (groups)->
  return _(groups).map(allGroupMembers).flatten().value()

allGroupMembers = (group)->
  { admin, members } = group
  return members.concat admin
