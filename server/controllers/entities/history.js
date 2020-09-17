// An endpoint to get entities history as snapshots and diffs
const _ = require('builders/utils')
const error_ = require('lib/error/error')
const responses_ = require('lib/responses')
const patches_ = require('./lib/patches')
const { hasAdminAccess } = require('lib/user_access_levels')
const { _id: anonymizedId } = require('db/couchdb/hard_coded_documents').users.anonymized
const user_ = require('controllers/user/lib/user')

const sanitization = {
  id: {}
}

const controller = async (params, req) => {
  const { id } = params
  const patches = await patches_.getWithSnapshots(id)
  if (!hasAdminAccess(req.user)) await anonymizePatches(patches)
  return { patches }
}

const anonymizePatches = async patches => {
  const usersIds = _.uniq(_.map(patches, 'user'))
  const users = await user_.byIds(usersIds)
  const anonymizedUserIdsByUserIds = buildAnonymizedUserIdsMap(users)
  patches.forEach(patch => {
    patch.user = anonymizedUserIdsByUserIds[patch.user]
  })
}

const buildAnonymizedUserIdsMap = users => {
  const anonymizedUserIdsByUserIds = {}
  for (const user of users) {
    const userSetting = _.get(user, 'settings.contributions.anonymize')
    if (userSetting === false) {
      anonymizedUserIdsByUserIds[user._id] = user._id
    } else {
      anonymizedUserIdsByUserIds[user._id] = anonymizedId
    }
  }
  return anonymizedUserIdsByUserIds
}

module.exports = { sanitization, controller }
