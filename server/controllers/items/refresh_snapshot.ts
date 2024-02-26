import { refreshSnapshotFromUri } from '#controllers/items/lib/snapshot/refresh_snapshot'
import { isEntityUri } from '#lib/boolean_validations'
import { wait } from '#lib/promises'
import { log, warn } from '#lib/utils/logs'

const sanitization = {
  uris: {},
}

const controller = async ({ uris }) => {
  await refreshSequentially(uris)
  return { ok: true }
}

const refreshSequentially = async uris => {
  const refreshNext = async () => {
    const nextUri = uris.pop()

    if (nextUri == null) return

    if (!isEntityUri(nextUri)) {
      warn(nextUri, 'invalid entity URI: not refreshing')
      return refreshNext()
    }

    log(nextUri, 'next URI for items snapshot refresh')

    await refreshSnapshotFromUri(nextUri)
    // Space refreshes to lower stress on production resources
    await wait(100)
    return refreshNext()
  }

  return refreshNext()
}

export default { sanitization, controller }
