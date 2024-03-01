import { newError } from '#lib/error/error'
import { someMatch } from '#lib/utils/base'
import { getAllowedVisibilityKeys } from '#lib/visibility/allowed_visibility_keys'

// MUST return the item or throw an error
export async function verifyRightToInteractWithItem ({ reqUserId, item, ownerAllowed }) {
  const { owner: ownerId, visibility } = item

  // item owner right to interact depends on the interaction
  // ex: comment-> allowed, request-> not allowed
  if (ownerId === reqUserId) {
    if (ownerAllowed) return item
    else throw forbidden(reqUserId, item)
  }

  // No one can interact on a private item
  if (visibility.length === 0) throw forbidden(reqUserId, item)
  // Anyone can interact on a public item
  if (visibility.includes('public')) return item

  const allowedVisibilityKeys = await getAllowedVisibilityKeys(ownerId, reqUserId)
  return someMatch(visibility, allowedVisibilityKeys)
}

const forbidden = (userId, item) => {
  return newError('not allowed with this item', 403, { userId, item })
}
