import { getInvClaimsByClaimValue } from '#controllers/entities/lib/entities'
import { removePlaceholder } from '#controllers/entities/lib/placeholders'
import { unprefixify } from '#controllers/entities/lib/prefix'
import { wait } from '#lib/promises'
import { warn } from '#lib/utils/logs'
import { updateInvClaim } from './update_inv_claim.js'

export default (user, uris) => {
  const reqUserId = user._id

  // Removing sequentially to avoid edit conflicts if entities or items
  // are concerned by several of the deleted entities.
  // This makes it a potentially slow operation, which is OK, as it's an admin task
  async function removeNext () {
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

async function deleteUriValueClaims (user, uri) {
  const claimsData = await getInvClaimsByClaimValue(uri)
  return removeClaimsSequentially(user, uri, claimsData)
}

function removeClaimsSequentially (user, uri, claimsData) {
  async function removeNextClaim () {
    const claimData = claimsData.pop()
    if (claimData == null) return
    warn(claimData, `removing claims with value: ${uri}`)
    await removeClaim(user, uri, claimData)
    await wait(100)
    return removeNextClaim()
  }

  return removeNextClaim()
}

function removeClaim (user, uri, claimData) {
  const { entity: id, property } = claimData
  return updateInvClaim(user, id, property, uri, null)
}
