CONFIG = require 'config'
__ = CONFIG.root
_ = __.require 'builders', 'utils'
couch_ = __.require 'lib', 'couch'

module.exports = (db)->
  getUserRelations: (userId)->
    query =
      startkey: [userId]
      endkey: [userId, {}]
    db.view 'relations', 'byStatus', query
    .then parseRelations

  getUserFriends: (userId)->
    query = { key: [userId, 'friends'] }
    db.view 'relations', 'byStatus', query
    .then couch_.mapValueId


parseRelations = (res)->
  _.log res, 'parseRelations res'
  relations = initRelations()
  res.rows.forEach spreadRelation.bind(null, relations)
  return relations

initRelations = ->
  friends: []
  userRequested: []
  otherRequested: []

spreadRelation = (relations, row)->
  type = row.key[1]
  id = row.value._id
  if type? and id?
    relations[type].push id