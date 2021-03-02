// An endpoint to list entities edits made by a user
const error_ = require('lib/error/error')
const patches_ = require('./lib/patches')
const user_ = require('controllers/user/lib/user')
const { shouldBeAnonymized } = require('models/user')
const anonymizePatches = require('./lib/anonymize_patches')

const sanitization = {
  user: { optional: true },
  limit: { default: 100, max: 1000 },
  offset: { default: 0 }
}

const getContributions = async ({ userId, limit, offset, reqUserHasAdminAccess }) => {
  if (userId && !reqUserHasAdminAccess) {
    const user = await user_.byId(userId)
    if (shouldBeAnonymized(user)) {
      throw error_.new('non-public contributions', 403)
    }
  }

  let patchesPage
  if (userId != null) {
    patchesPage = await patches_.byUserId(userId, limit, offset)
  } else {
    patchesPage = await patches_.byDate(limit, offset)
  }

  if (!reqUserHasAdminAccess) await anonymizePatches(patchesPage.patches)

  return patchesPage
}

module.exports = { sanitization, controller: getContributions }
