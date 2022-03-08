const _ = require('builders/utils')
const { wait } = require('lib/promises')
const entities_ = require('./entities')
const updateInvClaim = require('./update_inv_claim')
const placeholders_ = require('./placeholders')
const { unprefixify } = require('controllers/entities/lib/prefix')

module.exports = (user, uris) => {
  const reqUserId = user._id

  // Removing sequentially to avoid edit conflicts if entities or items
  // are concerned by several of the deleted entities.
  // This makes it a potentially slow operation, which is OK, as it's an admin task
  const removeNext = async () => {
    const uri = uris.pop()
    if (uri == null) return

    const id = unprefixify(uri)

    _.warn(uri, 'removing entity')

    await tolerantRemove(reqUserId, id)
    await deleteUriValueClaims(user, uri)
    await wait(100)
    return removeNext()
  }

  return removeNext()
}

// Turning deleted entities into removed:placeholder as it as largely the same effect
// as deleting (not indexed by views any more) but it's reversible, and already
// understood by other services, that will either unindex it (search engine updater)
// or ignore it (client)
const tolerantRemove = (reqUserId, id) => {
  return placeholders_.remove(reqUserId, id)
  .catch(err => {
    // If the entity was already turned into a removed:placeholder
    // there is no new change and this operation produces and 'empty patch' error
    // that we can ignore, as it's simply already in the desired state
    if (err.message === 'empty patch') {
      _.warn(id, 'this entity is already a removed:placeholder: ignored')
    } else {
      throw err
    }
  })
}

const deleteUriValueClaims = async (user, uri) => {
  const claimsData = await entities_.byClaimsValue(uri)
  return removeClaimsSequentially(user, uri, claimsData)
}

const removeClaimsSequentially = (user, uri, claimsData) => {
  const removeNextClaim = async () => {
    const claimData = claimsData.pop()
    if (claimData == null) return
    _.warn(claimData, `removing claims with value: ${uri}`)
    await removeClaim(user, uri, claimData)
    await wait(100)
    return removeNextClaim()
  }

  return removeNextClaim()
}

const removeClaim = (user, uri, claimData) => {
  const { entity: id, property } = claimData
  return updateInvClaim(user, id, property, uri, null)
}
