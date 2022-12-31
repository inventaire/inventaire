import _ from 'builders/utils'
import user_ from 'controllers/user/lib/user'
import { shouldBeAnonymized } from 'models/user'

export default async ({ patches, reqUserId }) => {
  const usersIds = _.uniq(_.map(patches, 'user'))
  const users = await user_.byIds(usersIds)
  const deanonymizedUsersIds = getDeanonymizedUsersIds(users)
  patches.forEach(patch => {
    if (patch.user === reqUserId) return
    if (deanonymizedUsersIds.has(patch.user)) return
    anonymizePatch(patch)
  })
}

const getDeanonymizedUsersIds = users => {
  const deanonymizedUsersIds = []
  for (const user of users) {
    if (!shouldBeAnonymized(user)) deanonymizedUsersIds.push(user._id)
  }
  return new Set(deanonymizedUsersIds)
}

const anonymizePatch = patch => {
  delete patch.user
}
