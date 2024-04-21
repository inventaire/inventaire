import restoreVersion from './lib/restore_version.js'

const sanitization = {
  patch: {},
}

async function controller ({ patchId, reqUserId }) {
  await restoreVersion(patchId, reqUserId)
  return { ok: true }
}

export default { sanitization, controller }
