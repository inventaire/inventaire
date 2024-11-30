import type { SanitizedParameters } from '#types/controllers_input_sanitization_parameters'
import { restoreVersion } from './lib/restore_version.js'

const sanitization = {
  patch: {},
}

async function controller ({ patchId, reqUserId }: SanitizedParameters) {
  await restoreVersion(patchId, reqUserId)
  return { ok: true }
}

export default { sanitization, controller }
