const _ = require('builders/utils')
const faker = require('faker')
const { customAuthReq } = require('../utils/request')
const { getFediversableUser } = require('../utils/utils')
const { createItem } = require('../fixtures/items')
const { addItemsToShelf } = require('../utils/shelves')

const fixtures = module.exports = {
  shelfName: () => `${faker.lorem.words(3)} shelf`,
  shelfDescription: () => faker.lorem.paragraph(),

  createShelf: async (userPromise, shelfData = {}) => {
    userPromise = userPromise || getFediversableUser()
    shelfData.name = shelfData.name || fixtures.shelfName()
    shelfData.listing = shelfData.listing || 'public'
    shelfData.description = shelfData.description || fixtures.shelfDescription()
    const user = await userPromise
    const endpoint = '/api/shelves?action=create'
    await customAuthReq(user, 'post', endpoint, shelfData)
    const ownerEndpoint = '/api/shelves?action=by-owners'
    const { shelves } = await customAuthReq(user, 'get', `${ownerEndpoint}&owners=${user._id}`)
    return {
      shelf: Object.values(shelves).find(shelf => shelf.name === shelfData.name),
      user
    }
  },

  createShelfWithItem: async (shelfData = {}, item) => {
    const { shelf, user } = await fixtures.createShelf(null, shelfData)
    item = await (item || createItem(user))
    const itemId = item._id
    await addItemsToShelf(user, shelf, [ itemId ])
    return { shelf, item, user }
  },

  createShelfWithItems: async (shelfData = {}, items) => {
    items = await Promise.all(items.map(item => item || createItem()))
    const itemsIds = _.map(items, '_id')
    const { shelf } = await fixtures.createShelf(null, shelfData)
    await addItemsToShelf(null, shelf, itemsIds)
    return { shelf, items }
  }
}
