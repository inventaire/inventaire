const faker = require('faker')

module.exports = {
  bookshelfName: () => { return `${faker.lorem.words(3)} bookshelf` },
  bookshelfDescription: () => faker.lorem.paragraph()
}
