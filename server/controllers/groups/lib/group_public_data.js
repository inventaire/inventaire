import { getAllGroupMembersIds } from '#controllers/groups/lib/users_lists'
import { getUsersAuthorizedDataByIds } from '#controllers/user/lib/user'
import { error_ } from '#lib/error/error'
import { assert_ } from '#lib/utils/assert_types'
import { getGroupById, getGroupBySlug } from './groups.js'

// fnName: byId or bySlug
// fnArgs: [ id ] or [ slug ]
export default async (fnName, fnArgs, reqUserId) => {
  assert_.array(fnArgs)
  let group
  if (fnName === 'bySlug') {
    group = await getGroupBySlug(...fnArgs)
  } else {
    group = await getGroupById(...fnArgs)
  }
  if (group == null) throw error_.notFound(fnArgs[0])
  const usersIds = getAllGroupMembersIds(group)
  const users = await getUsersAuthorizedDataByIds(usersIds, reqUserId)
  return { group, users }
}
