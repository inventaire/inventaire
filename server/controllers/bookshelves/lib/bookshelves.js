const __ = require('config').universalPath
const Bookshelf = __.require('models', 'bookshelf')
const promises_ = __.require('lib', 'promises')
const db = __.require('couch', 'base')('bookshelves')
const itemDb = __.require('couch', 'base')('items')

const bookshelves_ = module.exports = {
  create: params => {
    const bookshelf = Bookshelf.create(params)
    return db.postAndReturn(bookshelf)
  },
  byIds: db.fetch,
  byIdsWithItems: ids => {
    return promises_.all([ bookshelves_.byIds(ids), fetchItems(ids) ])
    .spread(assignItemsToBookshelves)
  }
}

const fetchItems = bookshelvesIds => {
  return itemDb.viewByKeys('byBookshelves', bookshelvesIds)
}

const assignItemsToBookshelves = (bookshelves, items) => {
  return bookshelves.map(bookshelf => {
    // TODO: stop faking it
    bookshelf.items = []
    return bookshelf
  })
}
