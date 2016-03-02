CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
couch_ = __.require 'lib', 'couch'
{ minKey, maxKey } = couch_
parseRelations = require './parse_relations'
groups_ = __.require 'controllers', 'groups/lib/groups'
Promise = require 'bluebird'

module.exports = (db)->

  getAllUserRelations = (userId, includeDocs=false)->
    db.view 'relations', 'byStatus',
      startkey: [userId, minKey]
      endkey: [userId, maxKey]
      include_docs: includeDocs

  return lists =
    getUserRelations: (userId)->
      getAllUserRelations userId
      .then parseRelations

    getUserFriends: (userId)->
      query = { key: [userId, 'friends'] }
      db.view 'relations', 'byStatus', query
      .then couch_.mapValue

    deleteUserRelations: (userId)->
      getAllUserRelations userId, true
      .then couch_.mapDoc
      .then db.bulkDelete

    getUserAndCoGroupsMembers: (userId)->
      Promise.all [
        lists.getUserFriends userId
        groups_.findUserGroupsCoMembers userId
      ]
      .spread (friends, coMembers)->
        return _.uniq friends.concat(coMembers)
