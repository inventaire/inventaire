__ = require('config').universalPath
_ = __.require 'builders', 'utils'
{ Promise } = __.require 'lib', 'promises'
entities_ = require './entities'
updateInvClaim = require './update_inv_claim'
placeholders_ = require './placeholders'
{ unprefixify } = __.require 'controllers', 'entities/lib/prefix'

module.exports = (user, uris)->
  reqUserId = user._id

  # Removing sequentially to avoid edit conflicts if entities or items
  # are concerned by several of the deleted entities.
  # This makes it a potentially slow operation, which is OK, as it's an admin task
  removeNext = ->
    uri = uris.pop()
    unless uri? then return

    id = unprefixify uri

    _.warn uri, 'removing entity'

    tolerantRemove reqUserId, id
    .then -> deleteUriValueClaims user, uri
    .delay 100
    .then removeNext

  return removeNext()

tolerantRemove = (reqUserId, id)->
  # Turning deleted entities into removed:placeholder as it as largely the same effect
  # as deleting (not indexed by views any more) but it's reversible, and already
  # understood by other services, that will either unindex it (search engine updater)
  # or ignore it (client)
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

deleteUriValueClaims = (user, uri)->
  entities_.byClaimsValue uri
  .then removeClaimsSequentially(user, uri)

removeClaimsSequentially = (user, uri)-> (claimsData)->
  removeNextClaim = ->
    claimData = claimsData.pop()
    unless claimData? then return
    _.warn claimData, "removing claims with value: #{uri}"
    removeClaim user, uri, claimData
    .delay 100
    .then removeNextClaim

  return removeNextClaim()

removeClaim = (user, uri, claimData)->
  { entity:id, property } = claimData
  return updateInvClaim user, id, property, uri, null
