// An endpoint to list entities edits made by a user
import { byUserId, byDate, byUserIdAndFilter } from './lib/patches/patches'

import error_ from 'lib/error/error'
import { isPropertyUri, isLang } from 'lib/boolean_validations'
import user_ from 'controllers/user/lib/user'
import { shouldBeAnonymized } from 'models/user'
import anonymizePatches from './lib/anonymize_patches'
import { hasAdminAccess } from 'lib/user_access_levels'

const sanitization = {
  user: { optional: true },
  limit: { default: 100, max: 1000 },
  offset: { default: 0 },
  filter: {
    generic: 'string',
    optional: true,
  }
}

const controller = async (params, req) => {
  const { userId, limit, offset, filter, reqUserId } = params
  const reqUserHasAdminAccess = hasAdminAccess(req.user)

  if (filter != null && !(isPropertyUri(filter) || isLang(filter))) {
    throw error_.new('invalid filter', 400, params)
  }

  if (userId != null && !reqUserHasAdminAccess) await checkPublicContributionsStatus(userId)

  const patchesPage = await getPatchesPage({ userId, limit, offset, reqUserHasAdminAccess, filter })
  const { patches } = patchesPage
  if (!reqUserHasAdminAccess) await anonymizePatches({ patches, reqUserId })

  return patchesPage
}

const getPatchesPage = async ({ userId, limit, offset, filter }) => {
  if (userId != null) {
    if (filter != null) {
      return byUserIdAndFilter({ userId, filter, limit, offset })
    } else {
      return byUserId({ userId, limit, offset })
    }
  } else {
    return byDate({ limit, offset })
  }
}

const checkPublicContributionsStatus = async userId => {
  const user = await user_.byId(userId)
  if (shouldBeAnonymized(user)) {
    throw error_.new('non-public contributions', 403, { userId })
  }
}

export default { sanitization, controller }
