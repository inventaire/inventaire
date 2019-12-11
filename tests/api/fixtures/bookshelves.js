const faker = require('faker')
const { authReq } = require('../utils/utils')

const fixtures = module.exports = {
  bookshelfName: () => { return `${faker.lorem.words(3)} bookshelf` },
  bookshelfDescription: () => faker.lorem.paragraph(),
  createBookshelf: () => {
    const description = fixtures.bookshelfDescription()
    const name = fixtures.bookshelfName()
    return Promise.resolve(
      authReq('post', '/api/bookshelves?action=create', {
        description,
        listing: 'public',
        name
      })
    )
  }
}
