const _ = require('builders/utils')
const shelves_ = require('controllers/shelves/lib/shelves')

const sanitization = {
  id: {},
  items: {}
}

const itemsActions = action => async ({ id, items, reqUserId }) => {
  const shelves = await shelves_[action]([ id ], items, reqUserId)
  return {
    shelves: _.keyBy(shelves, '_id')
  }
}

module.exports = {
  addItems: {
    sanitization,
    controller: itemsActions('addItems'),
    track: [ 'shelf', 'addItems' ]
  },
  removeItems: {
    sanitization,
    controller: itemsActions('removeItems'),
    track: [ 'shelf', 'removeItems' ]
  },
}
