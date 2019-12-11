const __ = require('config').universalPath
const _ = __.require('builders', 'utils')
const Bookshelf = __.require('models', 'bookshelf')

const db = __.require('couch', 'base')('bookshelves')
const itemDb = __.require('couch', 'base')('items')

const bookshelves_ = module.exports = {
  create: params => {
    const bookshelf = Bookshelf.create(params)
    return db.postAndReturn(bookshelf)
  },

  byIds: ids => {
    return db.fetch(ids)
    .then(bookshelves => {
      return bookshelves_.addItems(bookshelves)
    })
    .then(_.KeyBy('_id'))
  },

  addItems: bookshelves => {
    const ids = bookshelves.map(_.property('_id'))
    return itemDb.viewByKeys('byBookshelves', ids)
    .then(items => {
      return bookshelves.map(bookshelf => {
        // TODO: stop faking it
        bookshelf.items = []
        return bookshelf
      })
    })
  }
}
