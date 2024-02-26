import { keyBy } from 'lodash-es'
import { addItemsToShelves, removeItemsFromShelves } from '#controllers/shelves/lib/shelves'

const sanitization = {
  id: {},
  items: {},
}

const itemsActions = actionFn => async ({ id, items, reqUserId }) => {
  const shelves = await actionFn([ id ], items, reqUserId)
  return {
    shelves: keyBy(shelves, '_id'),
  }
}

export const addItems = {
  sanitization,
  controller: itemsActions(addItemsToShelves),
  track: [ 'shelf', 'addItems' ],
}

export const removeItems = {
  sanitization,
  controller: itemsActions(removeItemsFromShelves),
  track: [ 'shelf', 'removeItems' ],
}
