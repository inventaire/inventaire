import { map, uniq } from 'lodash-es'
import { getUsersByIds } from '#controllers/user/lib/user'
import { userShouldBeAnonymized } from '#models/user'
import type { Patch } from '#server/types/patch'
import type { UserId } from '#server/types/user'

interface AnonymizePatchesParams {
  patches: Patch[]
  reqUserId: UserId
}

export async function anonymizePatches ({ patches, reqUserId }: AnonymizePatchesParams) {
  const usersIds = uniq(map(patches, 'user'))
  const users = await getUsersByIds(usersIds)
  const deanonymizedUsersIds = getDeanonymizedUsersIds(users)
  patches.forEach(patch => {
    if (patch.user === reqUserId) return
    if (deanonymizedUsersIds.has(patch.user)) return
    anonymizePatch(patch)
  })
}

function getDeanonymizedUsersIds (users) {
  const deanonymizedUsersIds = []
  for (const user of users) {
    if (!userShouldBeAnonymized(user)) deanonymizedUsersIds.push(user._id)
  }
  return new Set(deanonymizedUsersIds)
}

function anonymizePatch (patch) {
  delete patch.user
}
