// An endpoint to get entities history as snapshots and diffs
import { getPatchesWithSnapshots } from '#controllers/entities/lib/patches/patches'
import { hasAdminAccess } from '#lib/user_access_levels'
import anonymizePatches from './lib/anonymize_patches.js'

const sanitization = {
  id: {},
}

async function controller (params, req) {
  const { id, reqUserId } = params
  const patches = await getPatchesWithSnapshots(id)
  if (!hasAdminAccess(req.user)) await anonymizePatches({ patches, reqUserId })
  return { patches }
}

export default { sanitization, controller }
