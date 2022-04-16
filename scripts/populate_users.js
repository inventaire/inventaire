#!/usr/bin/env node
require('module-alias/register')
const _ = require('builders/utils')
const { createUserWithItems } = require('../tests/api/fixtures/populate')
const { getRandomPosition, createUser } = require('../tests/api/fixtures/users')
const { createItemFromEntityUri, createEdition } = require('../tests/api/fixtures/entities')
const { makeFriends } = require('../tests/api/utils/relations')
const { createGroup, addMember, addAdmin } = require('../tests/api/fixtures/groups')

const [ username ] = process.argv.slice(2)
const run = async () => {
  const { user, items } = await createUserItemsWithEdition()
  const { entity: entityUri } = items[0]
  const commonEntityMessage = `Common item entity id: ${entityUri.split(':')[1]}`
  _.info(commonEntityMessage)
  await addGroupAndFriends(user, entityUri)
  const friends = await addFriendsWithItems(user, entityUri)
  const nonFriends = await createUsers(user, entityUri, { listing: 'public' })
  _.info(`Login available :
  Main username : ${username}
  Friends username : ${getUsernames(friends).join(', ')}
  Non friends username : ${getUsernames(nonFriends).join(', ')}
  ${commonEntityMessage}
  `)
  process.exit(0)
}

const createUserItemsWithEdition = async () => {
  const position = getRandomPosition()
  const edition = await createEdition()
  return createUserWithItems(
    { username, position },
    { entity: edition.uri }
  )
}

const createUsers = async (user, entityUri, itemData = {}) => {
  itemData.entity = entityUri || 'inv:00000000000000000000000000000000'
  const friends = await Promise.all([
    createUserWithPosition(user.position),
    createUserWithPosition(user.position),
    createUserWithPosition(user.position),
    createUserWithPosition()
  ])
  const createItemPromises = friends.map(createUserItem(entityUri, itemData))
  await Promise.all(createItemPromises)
  return friends
}
const addFriendsWithItems = async (user, entityUri, itemData = {}) => {
  const friends = await createUsers(user, entityUri)
  const makeAllFriends = friends.map(friend => makeFriends(user, friend))
  await Promise.all(makeAllFriends)
  _.info(`${getUsernames(friends)} should be friends with ${user.username}`)
  return friends
}

const createUserItem = (entityUri, itemData) => friend => {
  const { listing, transaction } = itemData
  itemData.listing = listing || _.sample([ 'public', 'network' ])
  itemData.transaction = transaction || _.sample([ 'giving', 'selling', 'inventorying', 'lending' ])
  return createItemFromEntityUri({
    user: friend,
    uri: entityUri,
    item: itemData
  })
}
const getUsernames = users => users.map(_.property('username'))

const addGroupAndFriends = async (user, entityUri) => {
  const [ friend1, friend2 ] = await addFriendsWithItems(user, entityUri)
  const group = await createGroup(user)
  await addAdmin(group, user)
  Promise.all([
    addMember(group, friend1),
    addMember(group, friend2)
  ])
  _.info(`${user.username} is now an group admin of group: "${group.name}"`)
}

const createUserWithPosition = async nearbyPosition => {
  const position = nearbyPosition ? getNearbyPosition(nearbyPosition) : getRandomPosition()
  const user = await createUser({ position })
  _.info(`Created user ${user.username} with position: ${user.position}`)
  return user
}
const getNearbyPosition = position => position.map(getRandomNearbyPosition)

const getRandomNearbyPosition = pos => {
  const min = pos - 0.5
  const max = pos + 0.5
  return Math.random() * (max - min) + min
}

run()
