// An endpoint to get entities history as snapshots and diffs
const _ = require('builders/utils')
const error_ = require('lib/error/error')
const responses_ = require('lib/responses')
const patches_ = require('./lib/patches')
const { hasAdminAccess } = require('lib/user_access_levels')
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
  const deanonymizedUsersIds = getDeanonymizedUsersIds(users)
  patches.forEach(patch => {
    if (!deanonymizedUsersIds.has(patch.user)) anonymizePatch(patch)
  })
}

const getDeanonymizedUsersIds = users => {
  const deanonymizedUsersIds = []
  for (const user of users) {
    const userSetting = _.get(user, 'settings.contributions.anonymize')
    if (userSetting === false) deanonymizedUsersIds.push(user._id)
  }
  return new Set(deanonymizedUsersIds)
}

const anonymizePatch = patch => {
  delete patch.user
}

module.exports = { sanitization, controller }
