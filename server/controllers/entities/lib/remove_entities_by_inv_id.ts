import { getInvClaimsByClaimValue } from '#controllers/entities/lib/entities'
import { removePlaceholder } from '#controllers/entities/lib/placeholders'
import { unprefixify } from '#controllers/entities/lib/prefix'
import type { UserWithAcct } from '#lib/federation/remote_user'
import { wait } from '#lib/promises'
import { warn } from '#lib/utils/logs'
import type { EntityUri, InvEntityId, InvEntityUri, PropertyUri } from '#types/entity'
import { updateInvClaim } from './update_inv_claim.js'

export async function removeEntitiesByInvId (user: UserWithAcct, uris: InvEntityUri[]) {
  // Removing sequentially to avoid edit conflicts if entities or items
  // are concerned by several of the deleted entities.
  // This makes it a potentially slow operation
  async function removeNext () {
    const uri = uris.pop()
    if (uri == null) return

    const id = unprefixify(uri)

    warn(uri, 'removing entity')

    await removePlaceholder(user.acct, id)
    await deleteUriValueClaims(user, uri)
    await wait(100)
    return removeNext()
  }

  return removeNext()
}

async function deleteUriValueClaims (user: UserWithAcct, uri: InvEntityUri) {
  const claimsData = await getInvClaimsByClaimValue(uri)
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

function removeClaim (user: UserWithAcct, uri: EntityUri, claimData: { entity: InvEntityId, property: PropertyUri }) {
  const { entity: id, property } = claimData
  return updateInvClaim(user, id, property, uri, null)
}
