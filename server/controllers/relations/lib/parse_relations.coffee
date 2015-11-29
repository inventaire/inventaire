module.exports = (res)->
  relations = initRelations()
  for row in res.rows
    spreadRelation relations, row
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