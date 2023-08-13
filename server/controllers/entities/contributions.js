// An endpoint to list entities edits made by a user
import { getPatchesByDate, getPatchesByUserId, getPatchesByUserIdAndFilter } from '#controllers/entities/lib/patches/patches'
import { getUserById } from '#controllers/user/lib/user'
import { isPropertyUri, isLang } from '#lib/boolean_validations'
import { error_ } from '#lib/error/error'
import { hasAdminAccess } from '#lib/user_access_levels'
import User from '#models/user'
import anonymizePatches from './lib/anonymize_patches.js'

const { shouldBeAnonymized } = User

const sanitization = {
  user: { optional: true },
  limit: { default: 100, max: 1000 },
  offset: { default: 0 },
  filter: {
    generic: 'string',
    optional: true,
  },
}

const controller = async (params, req) => {
  const { userId, limit, offset, filter, reqUserId } = params
  const reqUserHasAdminAccess = hasAdminAccess(req.user)

  if (filter != null && !(isPropertyUri(filter) || isLang(filter))) {
    throw error_.new('invalid filter', 400, params)
  }

  if (userId != null && !reqUserHasAdminAccess) await checkPublicContributionsStatus({ userId, reqUserId })

  const patchesPage = await getPatchesPage({ userId, limit, offset, reqUserHasAdminAccess, filter })
  const { patches } = patchesPage
  if (!reqUserHasAdminAccess) await anonymizePatches({ patches, reqUserId })

  return patchesPage
}

const getPatchesPage = async ({ userId, limit, offset, filter }) => {
  if (userId != null) {
    if (filter != null) {
      return getPatchesByUserIdAndFilter({ userId, filter, limit, offset })
    } else {
      return getPatchesByUserId({ userId, limit, offset })
    }
  } else {
    return getPatchesByDate({ limit, offset })
  }
}

const checkPublicContributionsStatus = async ({ userId, reqUserId }) => {
  if (userId === reqUserId) return
  const user = await getUserById(userId)
  if (shouldBeAnonymized(user)) {
    throw error_.new('non-public contributions', 403, { userId })
  }
}

export default { sanitization, controller }
