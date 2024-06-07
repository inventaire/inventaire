import { createInvEntity } from '#controllers/entities/lib/create_inv_entity'
import { getWdEntityLocalLayer } from '#controllers/entities/lib/entities'
import { prefixifyWd } from '#controllers/entities/lib/prefix'
import { updateInvClaim } from '#controllers/entities/lib/update_inv_claim'
import { newError } from '#lib/error/error'
import type { InvClaimValue, PropertyUri, WdEntityId } from '#server/types/entity'
import type { User } from '#server/types/user'

export async function updateWdEntityLocalClaims (user: User, wdId: WdEntityId, property: PropertyUri, oldValue: InvClaimValue, newValue: InvClaimValue) {
  const localEntityLayer = await getWdEntityLocalLayer(wdId)
  const wdUri = prefixifyWd(wdId)
  if (localEntityLayer) {
    return updateInvClaim(user, localEntityLayer._id, property, oldValue, newValue)
  } else {
    if (oldValue) {
      throw newError('local claim property value not found', 400, { wdId, property, oldValue, newValue })
    }
    const localEntityLayerClaims = {
      'invp:P1': [ wdUri ],
      [property]: [ newValue ],
    }
    await createInvEntity({
      claims: localEntityLayerClaims,
      userId: user._id,
    })
  }
}
