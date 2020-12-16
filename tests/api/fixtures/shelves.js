const __ = require('config').universalPath
const _ = __.require('builders', 'utils')
const faker = require('faker')
const { customAuthReq } = require('../utils/request')
const { authReq, getUser } = require('../utils/utils')
const { createItem } = require('../fixtures/items')

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
  createShelfWithItem: async (itemPromise, shelfData = {}) => {
    const item = await resolveOrCreateItem(itemPromise)
    const itemId = item._id
    const shelf = await fixtures.createShelf(null, shelfData)
    const shelvesWithItem = await authReq('post', '/api/shelves?action=add-items', {
      id: shelf._id,
      items: [ itemId ]
    })
    return _.values(shelvesWithItem.shelves)[0]
  }
}

const resolveOrCreateItem = async itemPromise => {
  return itemPromise ? itemPromise() : createItem()
}
