const __ = require('config').universalPath
const Bookshelf = __.require('models', 'bookshelf')
const promises_ = __.require('lib', 'promises')
const items_ = __.require('controllers', 'items/lib/items')
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
    .spread(assignItemsToBookshelves(ids))
  },
  addItems: (ids, itemsIds, userId) => {
    return addItems(itemsIds, ids, userId)
    .then(() => {
      return bookshelves_.byIdsWithItems(ids)
    })
  }
}

const addItems = (itemsIds, bookshelvesIds, userId) => {
  return items_.addBookshelves(itemsIds, bookshelvesIds, userId)
}

const fetchItems = bookshelvesIds => {
  return itemDb.viewByKeys('byBookshelves', bookshelvesIds)
}

const assignItemsToBookshelves = bookshelvesIds => (bookshelves, items) => {
  return bookshelves.map(bookshelf => {
    const bookshelfId = bookshelf._id
    const bookshelfItems = items.filter(item => {
      return item.bookshelves.includes(bookshelfId)
    })
    if (!bookshelf.items) { bookshelf.items = [] }
    bookshelf.items = bookshelf.items.concat(bookshelfItems)
    return bookshelf
  })
}
