const { revertFromPatchId } = require('./lib/revert_edit')

const sanitization = {
  patch: {}
}

const controller = async ({ patchId, reqUserId }) => {
  await revertFromPatchId(patchId, reqUserId)
  return { ok: true }
}

module.exports = { sanitization, controller }
