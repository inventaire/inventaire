import _ from '#builders/utils'
import { createUser } from './users.js'
import { createRandomizedItems } from './items.js'

let populatePromise
const usersCount = 8
const publicItemsPerUser = 10

const API = {
  populate: () => {
    if (populatePromise) return populatePromise
    populatePromise = Promise.all(_.times(usersCount, API.createUserWithItems))
    return populatePromise
  },

  createUserWithItems: async (userData, itemsData = []) => {
    const user = await createUser(userData)
    itemsData = _.times(publicItemsPerUser, i => itemsData[i] || {})
    await createRandomizedItems(user, itemsData)
    return user
  }
}
export default API
