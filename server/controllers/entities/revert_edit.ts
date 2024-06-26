import { revertFromPatchId } from './lib/revert_edit.js'

const sanitization = {
  patch: {},
}

async function controller ({ patchId, reqUserId }) {
  await revertFromPatchId(patchId, reqUserId)
  return { ok: true }
}

export default { sanitization, controller }
