const __ = require('config').universalPath
const _ = __.require('builders', 'utils')
const faker = require('faker')
const { authReq, customAuthReq, getUser } = require('../utils/utils')
const { createItem } = require('../fixtures/items')

const fixtures = module.exports = {
  shelfName: () => { return `${faker.lorem.words(3)} shelf` },
  shelfDescription: () => faker.lorem.paragraph(),

  createShelf: (userPromise, shelfData = {}) => {
    if (!userPromise) { userPromise = getUser() }
    if (!shelfData.listing) { shelfData.listing = 'public' }
    if (!shelfData.description) {
      shelfData.description = fixtures.shelfDescription()
    }
    if (!shelfData.name) {
      shelfData.name = fixtures.shelfName()
    }
    const endpoint = '/api/shelves?action=create'
    const req = customAuthReq(userPromise, 'post', endpoint, shelfData).get('shelf')
    return Promise.resolve(req)
  },
  createShelfWithItem: async itemPromise => {
    const item = await resolveOrCreateItem(itemPromise)
    const itemId = item._id
    const shelf = await fixtures.createShelf()
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
