const CONFIG = require('config')
const __ = CONFIG.universalPath
const Bookshelf = __.require('models', 'bookshelf')

const db = __.require('couch', 'base')('bookshelves')

module.exports = {
  create: params => {
    const bookshelf = Bookshelf.create(params)
    return db.postAndReturn(bookshelf)
  }
}
