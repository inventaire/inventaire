import { times } from 'lodash-es'
import { createRandomizedItems } from './items.js'
import { createUser } from './users.js'

let populatePromise
const usersCount = 8
const publicItemsPerUser = 10

export const populate = () => {
  if (populatePromise) return populatePromise
  populatePromise = Promise.all(times(usersCount, createUserWithItems))
  return populatePromise
}

export const createUserWithItems = async (userData, itemsData = []) => {
  const user = await createUser(userData)
  itemsData = times(publicItemsPerUser, i => itemsData[i] || {})
  await createRandomizedItems(user, itemsData)
  return user
}
