// An endpoint to get entities history as snapshots and diffs
const patches_ = require('./lib/patches')
const { hasAdminAccess } = require('lib/user_access_levels')
const { _id: anonymizedId } = require('db/couchdb/hard_coded_documents').users.anonymized

const sanitization = {
  id: {}
}

const controller = async (params, req) => {
  const { id } = params
  const patches = await patches_.getWithSnapshots(id)
  if (!hasAdminAccess(req.user)) patches.forEach(anonymizePatch)
  return { patches }
}

module.exports = { sanitization, controller }

const anonymizePatch = patch => { patch.user = anonymizedId }
