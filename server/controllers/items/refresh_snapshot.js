const _ = require('builders/utils')
const { wait } = require('lib/promises')
const refreshSnapshot = require('./lib/snapshot/refresh_snapshot')

const sanitization = {
  uris: {}
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
      _.warn(nextUri, 'invalid entity URI: not refreshing')
      return refreshNext()
    }

    _.log(nextUri, 'next URI for items snapshot refresh')

    await refreshSnapshot.fromUri(nextUri)
    // Space refreshes to lower stress on production resources
    await wait(100)
    return refreshNext()
  }

  return refreshNext()
}

module.exports = { sanitization, controller }
