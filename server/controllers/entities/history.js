// An endpoint to get entities history as snapshots and diffs
import { hasAdminAccess } from '#lib/user_access_levels'
import patches_ from './lib/patches/patches.js'
import anonymizePatches from './lib/anonymize_patches.js'

const sanitization = {
  id: {}
}

const controller = async (params, req) => {
  const { id, reqUserId } = params
  const patches = await patches_.getWithSnapshots(id)
  if (!hasAdminAccess(req.user)) await anonymizePatches({ patches, reqUserId })
  return { patches }
}

export default { sanitization, controller }
