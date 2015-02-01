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
    .then couch_.mapValue
    .then (res)-> _.log res, "getUserFriends result #{userId}"

parseRelations = (res)->
  _.log res, 'parseRelations res'
  relations = initRelations()
  res.rows.forEach spreadRelation.bind(null, relations)
  return relations

initRelations = ->
  friends: []
  userRequested: []
  otherRequested: []
  none: []

spreadRelation = (relations, row)->
  # view key looks like userId:relationType
  type = row.key[1]
  id = row.value
  if type in relationsTypes and id?
    relations[type].push id
  else throw new Error "spreadRelation err: type=#{type}, id=#{id}"

relationsTypes = [
  'friends'
  'userRequested'
  'otherRequested'
  'none'
]