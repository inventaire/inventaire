const __ = require('config').universalPath
const _ = __.require('builders', 'utils')
const faker = require('faker')
const { authReq, customAuthReq, getUser } = require('../utils/utils')
const { createItem } = require('../fixtures/items')

const fixtures = module.exports = {
  bookshelfName: () => { return `${faker.lorem.words(3)} bookshelf` },
  bookshelfDescription: () => faker.lorem.paragraph(),

  createBookshelf: (userPromise, bookshelfData = {}) => {
    if (!userPromise) { userPromise = getUser() }
    if (!bookshelfData.listing) { bookshelfData.listing = 'public' }
    if (!bookshelfData.description) {
      bookshelfData.description = fixtures.bookshelfDescription()
    }
    if (!bookshelfData.name) {
      bookshelfData.name = fixtures.bookshelfName()
    }
    return Promise.resolve(customAuthReq(userPromise, 'post', '/api/bookshelves?action=create', bookshelfData)
    )
  },
  createBookshelfWithItem: async itemPromise => {
    const item = await resolveOrCreateItem(itemPromise)
    const itemId = item._id
    const bookshelf = await fixtures.createBookshelf()
    const bookshelvesWithItem = await authReq('post', '/api/bookshelves?action=add-items', {
      id: bookshelf._id,
      items: [ itemId ]
    })
    return _.values(bookshelvesWithItem.bookshelves)[0]
  }
}

const resolveOrCreateItem = async itemPromise => {
  return itemPromise ? itemPromise() : createItem()
}
