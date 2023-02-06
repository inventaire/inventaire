import { getEntitiesByClaimsValue } from '#controllers/entities/lib/entities'
import { removePlaceholder } from '#controllers/entities/lib/placeholders'
import { unprefixify } from '#controllers/entities/lib/prefix'
import { wait } from '#lib/promises'
import { warn } from '#lib/utils/logs'
import updateInvClaim from './update_inv_claim.js'

export default (user, uris) => {
  const reqUserId = user._id

  // Removing sequentially to avoid edit conflicts if entities or items
  // are concerned by several of the deleted entities.
  // This makes it a potentially slow operation, which is OK, as it's an admin task
  const removeNext = async () => {
    const uri = uris.pop()
    if (uri == null) return

    const id = unprefixify(uri)

    warn(uri, 'removing entity')

    await removePlaceholder(reqUserId, id)
    await deleteUriValueClaims(user, uri)
    await wait(100)
    return removeNext()
  }

  return removeNext()
}

const deleteUriValueClaims = async (user, uri) => {
  const claimsData = await getEntitiesByClaimsValue(uri)
  return removeClaimsSequentially(user, uri, claimsData)
}

const removeClaimsSequentially = (user, uri, claimsData) => {
  const removeNextClaim = async () => {
    const claimData = claimsData.pop()
    if (claimData == null) return
    warn(claimData, `removing claims with value: ${uri}`)
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
