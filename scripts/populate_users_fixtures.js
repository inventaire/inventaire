#!/usr/bin/env node
const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')
const { createUserWithItems } = require('../tests/api/fixtures/populate')
const [ username ] = process.argv.slice(2)
const { makeFriends } = require('../tests/api/utils/relations')
const { createGroup, addMember, addAdmin } = require('../tests/api/fixtures/groups')
const user_ = __.require('controllers', 'user/lib/user')

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
  _.success(`New user ${user.username} with id ${user._id}`)
  const [ friend1, friend2 ] = await Promise.all([
    addFriendsToUser(user),
    addFriendsToUser(user)
  ])

  const group = await createGroup(user)
  await Promise.all([
    addAdmin(group, user),
    addMember(group, friend1),
    addMember(group, friend2)
  ])
  console.log(`Group "${group.name}" has been created`)
  console.log(`  Admin: ${user.username}`)
  console.log(`  Members: ${friend1.username}, ${friend2.username}`)

  _.info(`You can now login with :
  - Username : ${user.username}
  - Password : 12345678`) // Password as defined in "fixtures/users"
  return process.exit(0)
}

const addFriendsToUser = async user => {
  const friend = await createUserWithItems()
  await makeFriends(user, friend)
  console.log(`${user.username} is now friend with ${friend.username}`)
  return friend
}

run()
