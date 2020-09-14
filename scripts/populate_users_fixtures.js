#!/usr/bin/env node
const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')
const { createUserWithItems } = require('../tests/api/fixtures/populate')
const [ username ] = process.argv.slice(2)
const { makeFriends } = require('../tests/api/utils/relations')
const user_ = __.require('controllers', 'user/lib/user')

if (username) {
  user_.findOneByUsername(username)
  .then(({ _id }) => {
    if (_id) {
      console.log(`Username already exists at ${_id}`)
      return process.exit(0)
    }
  })
}

createUserWithItems({ username })
.then(userCreated => {
  _.success(`New user ${userCreated.username} with id ${userCreated._id}`)
  return Promise.all([
    addFriendsToUser(userCreated),
    addFriendsToUser(userCreated)
  ])
  .then(() => {
    return userCreated
  })
})
.then(userCreated => {
  _.info(`You can now login with :
  - Username : ${userCreated.username}
  - Password : 12345678`
  ) // as defined in "fixtures/users"
  return process.exit(0)
})
.catch(_.Error('users fixture err'))

const addFriendsToUser = async user => {
  const userCreated = await createUserWithItems()
  await makeFriends(user, userCreated)
  console.log(`${user.username} is now friend with ${userCreated.username}`)
}
