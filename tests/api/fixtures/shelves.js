const __ = require('config').universalPath
const _ = require('builders/utils')
const faker = require('faker')
const { customAuthReq } = require('../utils/request')
const { getUser } = require('../utils/utils')
const { createItem } = require('../fixtures/items')
const { addItemsToShelf } = require('../utils/shelves')

const fixtures = module.exports = {
  shelfName: () => `${faker.lorem.words(3)} shelf`,
  shelfDescription: () => faker.lorem.paragraph(),

  createShelf: async (userPromise, shelfData = {}) => {
    userPromise = userPromise || getUser()
    shelfData.name = shelfData.name || fixtures.shelfName()
    shelfData.listing = shelfData.listing || 'public'
    shelfData.description = shelfData.description || fixtures.shelfDescription()
    const endpoint = '/api/shelves?action=create'
    await customAuthReq(userPromise, 'post', endpoint, shelfData)

    const ownerEndpoint = '/api/shelves?action=by-owners'
    const user = await userPromise
    const { shelves } = await customAuthReq(userPromise, 'get', `${ownerEndpoint}&owners=${user._id}`)
    return Object.values(shelves).find(shelf => shelf.name === shelfData.name)
  },

  createShelfWithItem: async (shelfData = {}, item) => {
    item = await (item || createItem())
    const itemId = item._id
    const shelf = await fixtures.createShelf(null, shelfData)
    await addItemsToShelf(null, shelf, [ itemId ])
    return { shelf, item }
  },

  createShelfWithItems: async (shelfData = {}, items) => {
    items = await Promise.all(items.map(item => item || createItem()))
    const itemsIds = _.map(items, '_id')
    const shelf = await fixtures.createShelf(null, shelfData)
    await addItemsToShelf(null, shelf, itemsIds)
    return { shelf, items }
  }
}
