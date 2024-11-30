import { refreshSnapshotFromUri } from '#controllers/items/lib/snapshot/refresh_snapshot'
import { isEntityUri } from '#lib/boolean_validations'
import { wait } from '#lib/promises'
import { log, warn } from '#lib/utils/logs'
import type { SanitizedParameters } from '#types/controllers_input_sanitization_parameters'

const sanitization = {
  uris: {},
}

async function controller ({ uris }: SanitizedParameters) {
  await refreshSequentially(uris)
  return { ok: true }
}

async function refreshSequentially (uris) {
  async function refreshNext () {
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
