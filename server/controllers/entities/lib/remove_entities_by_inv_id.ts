import { removePlaceholder } from '#controllers/entities/lib/placeholders'
import type { UserWithAcct } from '#lib/federation/remote_user'
import { wait } from '#lib/promises'
import { warn } from '#lib/utils/logs'
import type { InvEntityUri } from '#types/entity'

export async function removeEntitiesByInvId (user: UserWithAcct, uris: InvEntityUri[]) {
  // Removing sequentially to avoid edit conflicts if entities or items
  // are concerned by several of the deleted entities.
  // This makes it a potentially slow operation
  async function removeNext () {
    const uri = uris.pop()
    if (uri == null) return

    warn(uri, 'removing entity')

    await removePlaceholder(user, uri)
    await wait(100)
    return removeNext()
  }

  return removeNext()
}
