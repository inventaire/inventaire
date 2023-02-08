#!/usr/bin/env node
import _ from 'lodash-es'
import { createGroup, addMember, addAdmin } from '#fixtures/groups'
import { info } from '#lib/utils/logs'
import {
  createEdition,
  createItemFromEntityUri,
  randomLabel,
} from '../tests/api/fixtures/entities.js'
import { createUserWithItems } from '../tests/api/fixtures/populate.js'
import { createUser, getRandomPosition } from '../tests/api/fixtures/users.js'
import { makeFriends } from '../tests/api/utils/relations.js'

const [ username ] = process.argv.slice(2)

export async function run () {
  if (!username) {
    console.log('no username passed as argument')
    process.exit(1)
  }
  const { user, work, edition } = await createUserItemsWithEdition()
  const { edition: edition2 } = await createUserItemsWithEdition({ user, work })
  const { edition: edition3 } = await createUserItemsWithEdition({ user, work })
  const [ friends, nonFriends ] = await createUserNetworkWithEdition(user, edition)
  await createUserNetworkWithEdition(user, edition2)
  await createUserNetworkWithEdition(user, edition3)

  info(`Login available :
  Main username : ${username}
  Friends username : ${getUsernames(friends).join(', ')}
  Non friends username : ${getUsernames(nonFriends).join(', ')}
  `)
  process.exit(0)
}
export async function createUserNetworkWithEdition (user, edition) {
  const editionUri = edition.uri
  const commonEntityMessage = `Common items entity id: ${editionUri}`
  info(commonEntityMessage)
  return Promise.all([
    addFriendsWithItems(user, editionUri),
    createUsers(user, editionUri, { visibility: [ 'public' ] }),
    addGroupAndFriends(user, editionUri),
  ])
}

export async function createUserItemsWithEdition (params) {
  let work, user, position, title, edition
  if (params) {
    work = params.work
    user = params.user
    title = params.title || randomLabel()
    edition = await createEdition({
      worksUris: [ work ],
    })
  } else {
    edition = await createEdition()
    position = getRandomPosition()
    work = edition.claims['wdt:P629'][0]
    info(`Common work uri: ${work}`)
    title = edition.claims['wdt:P1476'][0]
    user = { username, position }
  }
  const res = await createUserWithItems(
    user,
    { entity: edition.uri }
  )
  return Object.assign(res, { work, title, edition })
}

export async function createUsers (user, entityUri, itemData = {}) {
  itemData.entity = entityUri || 'inv:00000000000000000000000000000000'
  const { position } = user
  const friends = await Promise.all([
    createUserWithPosition(position),
    createUserWithPosition(position),
    createUserWithPosition(position),
    createUserWithPosition(),
  ])
  const createItemPromises = friends.map(createUserItem(entityUri, itemData))
  await Promise.all(createItemPromises)
  return friends
}

const createUserItem = (entityUri, itemData) => friend => {
  const { visibility, transaction } = itemData
  itemData.visibility = visibility || _.sample([ [ 'public' ], [ 'public', 'friends' ] ])
  itemData.transaction = transaction || _.sample([ 'giving', 'selling', 'inventorying', 'lending' ])
  return createItemFromEntityUri({
    user: friend,
    uri: entityUri,
    item: itemData,
  })
}
const getUsernames = users => users.map(_.property('username'))

async function addGroupAndFriends (user, entityUri) {
  const [ friend1, friend2 ] = await addFriendsWithItems(user, entityUri)
  const group = await createGroup(user)
  await addAdmin(group, user)
  Promise.all([
    addMember(group, friend1),
    addMember(group, friend2),
  ])
  info(`${user.username} is now an group admin of group: "${group.name}"`)
}

const addFriendsWithItems = async (user, entityUri) => {
  const friends = await createUsers(user, entityUri)
  Promise.all(friends.map(friend => makeFriends(user, friend)))
  info(`${getUsernames(friends)} should be friends with ${user.username}`)
  return friends
}

const createUserWithPosition = async nearbyPosition => {
  const position = nearbyPosition ? getNearbyPosition(nearbyPosition) : getRandomPosition()
  const user = await createUser({ position })
  info(`Created user ${user.username} with position: ${user.position}`)
  return user
}
const getNearbyPosition = position => position.map(getRandomNearbyPosition)

const getRandomNearbyPosition = pos => {
  const min = pos - 0.5
  const max = pos + 0.5
  return Math.random() * (max - min) + min
}

run()
