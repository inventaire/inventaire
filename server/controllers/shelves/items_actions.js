import _ from '#builders/utils'
import shelves_ from '#controllers/shelves/lib/shelves'

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

export default {
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
