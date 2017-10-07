__ = require('config').universalPath
_ = __.require 'builders', 'utils'

module.exports = (res)->
  relations = _.initCollectionsIndex relationsTypes
  for row in res.rows
    spreadRelation relations, row
  return relations

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