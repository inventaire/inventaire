CONFIG = require 'config'
__ = CONFIG.root
_ = __.require 'builders', 'utils'

# sharing items db as followed entities
# are also a relation between a user and an entity
db =  __.require('lib', 'items').db
user_ = __.require 'lib', 'user'
couch_ = __.require 'lib', 'couch'

FollowedEntities = __.require 'models', 'followed_entities'
{EntityUri} = __.require 'models','common-tests'

module.exports =
  fetch: (req, res, next)->
    user_.getUserId(req.session.email)
    .then fetchFollowingDoc
    .then (doc)->
      if doc? then res.json(doc)
      else res.send()
    .catch _.errorHandler.bind(_, res)

  update: (req, res, next)->
    entity = req.body.entity
    following = JSON.parse req.body.following

    unless EntityUri.test(entity)
      return _.errorHandler res, "bad entity uri: #{entity}", 400

    unless _.typeOf(following) is 'boolean'
      return _.errorHandler res, "following isnt a boolean: #{following}", 400

    user_.getUserId(req.session.email)
    .then updateFollowingDoc.bind(null, entity, following)
    .then -> res.send()
    .catch _.errorHandler.bind(_, res)


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
