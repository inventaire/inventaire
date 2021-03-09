#!/usr/bin/env node
const _ = require('builders/utils')
const { createUserWithItems } = require('../tests/api/fixtures/populate')
const { addRole } = require('controllers/user/lib/user')
const { makeFriends } = require('../tests/api/utils/relations')
const { createGroup, addMember, addAdmin } = require('../tests/api/fixtures/groups')
const user_ = require('controllers/user/lib/user')

const [ username ] = process.argv.slice(2)

const run = async () => {
  try {
    const { _id } = await user_.findOneByUsername(username)
    console.log(`Username ${username} already exists at ${_id}`)
    return process.exit(0)
  } catch (err) {
    createUserAndGroupAndGFriends(username)
  }
}

const createUserAndGroupAndGFriends = async username => {
  const user = await createUserWithItems({ username })
  _.info(`${user.username} is a new user`)
  await addRole(user._id, 'admin')
  _.info(`${user.username} has now an 'admin' role`)

  const [ friend1, friend2 ] = await Promise.all([
    addFriendsToUser(user),
    addFriendsToUser(user)
  ])
  _.info(`${user.username} is now friend with ${friend1.username} and ${friend2.username}`)

  const group = await createGroup(user)
  await addAdmin(group, user)
  await addMember(group, friend1)
  await addMember(group, friend2)
  _.info(`${user.username} is now an group admin of group: "${group.name}"`)
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
