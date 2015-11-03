CONFIG = require 'config'
__ = CONFIG.root
_ = __.require 'builders', 'utils'
error_ = __.require 'lib', 'error/error'
# sharing items db as followed entities
# are also a relation between a user and an entity
db =  __.require('lib', 'items').db
user_ = __.require 'lib', 'user/user'
couch_ = __.require 'lib', 'couch'

FollowedEntities = __.require 'models', 'followed_entities'
tests = __.require 'models','tests/common-tests'

module.exports =
  fetch: (req, res, next)->
    user_.getUserId(req)
    .then fetchFollowingDoc
    .then (doc)->
      if doc? then res.json(doc)
      else res.json {}
    .catch error_.Handler(res)

  update: (req, res, next)->
    entity = req.body.entity
    following = JSON.parse req.body.following

    unless tests.entityUri(entity)
      return error_.bundle res, "bad entity uri: #{entity}", 400

    unless _.typeOf(following) is 'boolean'
      return error_.bundle res, "following isnt a boolean: #{following}", 400

    user_.getUserId(req)
    .then updateFollowingDoc.bind(null, entity, following)
    .then -> res.send('ok')
    .catch error_.Handler(res)


fetchFollowingDoc = (userId)->
  db.get FollowedEntities.docId(userId)
  .catch couch_.ignoreNotFound

updateFollowingDoc = (entity, following, userId)->
  docId = FollowedEntities.docId(userId)
  db.update docId, (doc)->
    # if doc doesnt exist, cot creates one: {_id: doc._id}
    # thus the need to test doc.status entities
    unless doc?.entities?
      _.extend doc, FollowedEntities.create(userId)
    doc.entities[entity] = following
    _.log doc, "followed entities update"
    return doc
