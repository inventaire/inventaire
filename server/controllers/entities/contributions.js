// An endpoint to list entities edits made by a user
const { byUserId, byDate, byUserIdAndFilter } = require('./lib/patches')
const error_ = require('lib/error/error')
const { isPropertyUri, isLang } = require('lib/boolean_validations')
const user_ = require('controllers/user/lib/user')
const { shouldBeAnonymized } = require('models/user')
const anonymizePatches = require('./lib/anonymize_patches')

const sanitization = {
  user: { optional: true },
  limit: { default: 100, max: 1000 },
  offset: { default: 0 },
  filter: {
    generic: 'string',
    optional: true,
  }
}

const controller = async params => {
  const { userId, limit, offset, filter, reqUserHasAdminAccess } = params
  if (filter != null && !(isPropertyUri(filter) || isLang(filter))) {
    throw error_.new('invalid filter', 400, params)
  }
  const patchesPage = await getPatchesPage({ userId, limit, offset, reqUserHasAdminAccess, filter })
  if (!reqUserHasAdminAccess) await anonymizePatches(patchesPage.patches)
  return patchesPage
}

const getPatchesPage = async ({ userId, limit, offset, reqUserHasAdminAccess, filter }) => {
  if (userId != null) {
    if (!reqUserHasAdminAccess) {
      const user = await user_.byId(userId)
      if (shouldBeAnonymized(user)) {
        throw error_.new('non-public contributions', 403, { userId })
      }
    }
    if (filter != null) {
      return byUserIdAndFilter({ userId, filter, limit, offset })
    } else {
      return byUserId({ userId, limit, offset })
    }
  } else {
    return byDate({ limit, offset })
  }
}

module.exports = { sanitization, controller }
