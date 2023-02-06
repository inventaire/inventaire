import _ from '#builders/utils'
import { wait } from '#lib/promises'
import { log, warn } from '#lib/utils/logs'
import refreshSnapshot from './lib/snapshot/refresh_snapshot.js'

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

    if (!_.isEntityUri(nextUri)) {
      warn(nextUri, 'invalid entity URI: not refreshing')
      return refreshNext()
    }

    log(nextUri, 'next URI for items snapshot refresh')

    await refreshSnapshot.fromUri(nextUri)
    // Space refreshes to lower stress on production resources
    await wait(100)
    return refreshNext()
  }

  return refreshNext()
}

export default { sanitization, controller }
