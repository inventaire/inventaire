const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')
const { createUser } = require('./users')
const { createRandomizedItems } = require('./items')

let populatePromise
const usersCount = 8
const publicItemsPerUser = 10

const API = module.exports = {
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
