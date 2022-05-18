const { byIdsWithSelections } = require('controllers/lists/lib/lists')
const filterVisibleDocs = require('lib/filter_visible_docs')
const error_ = require('lib/error/error')
const { Paginate } = require('controllers/items/lib/queries_commons')

const sanitization = {
  id: {},
  // Selections pagination
  limit: { optional: true },
  offset: { optional: true }
}

const controller = async ({ id, withSelections, limit, offset, reqUserId }, req) => {
  const [ list ] = await byIdsWithSelections(id, reqUserId)
  if (!list) throw error_.notFound({ id })

  const authorizedLists = await filterVisibleDocs([ list ], reqUserId)
  if (authorizedLists.length === 0) {
    throw error_.unauthorized(req, 'unauthorized lists access', { id })
  }
  await paginateSelections(list, offset, limit)
  return list
}

const paginateSelections = async (list, offset, limit) => {
  const { selections } = list
  const page = await Paginate({ offset, limit })(selections)
  list.selections = page.items
}

module.exports = { sanitization, controller }
