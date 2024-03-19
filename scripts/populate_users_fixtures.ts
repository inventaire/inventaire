#!/usr/bin/env tsx
import { addUserRole } from '#controllers/user/lib/user'
import { info } from '#lib/utils/logs'
import { createGroup, addMember, addAdmin } from '#tests/api/fixtures/groups'
import { createUserWithItems } from '#tests/api/fixtures/populate'
import { getOrCreateUser } from '#tests/api/fixtures/users'
import { makeFriends } from '#tests/api/utils/relations'

const [ username ] = process.argv.slice(2)

const run = async () => {
  const user = await getOrCreateUser({ username })
  if (!user.roles.includes('admin')) {
    await addUserRole(user._id, 'admin')
    info(`${user.username} has now an 'admin' role`)
  }
  await createGroupAndFriends(user)
  process.exit(0)
}

const createGroupAndFriends = async user => {
  const [ friend1, friend2 ] = await Promise.all([
    addFriendsToUser(user),
    addFriendsToUser(user),
  ])
  info(`${user.username} is now friend with ${friend1.username} and ${friend2.username}`)

  const group = await createGroup(user)
  await addAdmin(group, user)
  await addMember(group, friend1)
  await addMember(group, friend2)
  info(`${user.username} is now an group admin of group: "${group.name}"`)
  console.log(`Login available :
  Username : ${user.username}
  Password : 12345678`) // Password also defined in "fixtures/users"
}

const addFriendsToUser = async user => {
  const friend = await createUserWithItems()
  await makeFriends(user, friend)
  return friend
}

run()
