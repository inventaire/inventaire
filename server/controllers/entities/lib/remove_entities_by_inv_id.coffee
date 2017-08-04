__ = require('config').universalPath
_ = __.require 'builders', 'utils'
{ Promise } = __.require 'lib', 'promises'
entities_ = require './entities'
updateInvClaim = require './update_inv_claim'
placeholders_ = require './placeholders'

module.exports = (user, uris)->
  ids = uris.map unprefixify

  Promise.all [
    removeEntities user._id, ids
    deleteUrisValueClaims(user, uris)
  ]

unprefixify = (uri)-> uri.split(':')[1]

# Turning deleted entities into removed:placeholder as it as largely the same effect
# as deleting (not indexed by views any more) but it's reversible, and already
# understood by other services, that will either unindex it (search engine updater)
# or ignore it (client)
removeEntities = (reqUserId, ids)->
  Promise.all ids.map(tolerantRemove(reqUserId))

tolerantRemove = (reqUserId)-> (id)->
  placeholders_.remove reqUserId, id
  .catch (err)->
    # If the entity was already turned into a removed:placeholder
    # there is no new change and this operation produces and 'empty patch' error
    # that we can ignore, as it's simply already in the desired state
    if err.message is 'empty patch'
      _.warn id, 'this entity is already a removed:placeholder: ignored'
      return
    else
      throw err

deleteUrisValueClaims = (user, uris)->
  Promise.all uris.map(deleteUriValueClaims(user))

deleteUriValueClaims = (user)-> (uri)->
  entities_.byClaimsValue uri
  .map (claimData)->
    { entity:id, property } = claimData
    return updateInvClaim user, id, property, uri, null
