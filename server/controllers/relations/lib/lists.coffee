CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
couch_ = __.require 'lib', 'couch'
parseRelations = require './parse_relations'

module.exports = (db)->

  getAllUserRelations = (userId, includeDocs=false)->
    db.view 'relations', 'byStatus',
      startkey: [userId]
      endkey: [userId, {}]
      include_docs: includeDocs

  lists =
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
