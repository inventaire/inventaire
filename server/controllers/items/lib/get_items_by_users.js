const { addAssociatedData, Paginate } = require('./queries_commons')
const items_ = require('controllers/items/lib/items')
const filterVisibleDocs = require('lib/visibility/filter_visible_docs')
const { filterPrivateAttributes } = require('controllers/items/lib/filter_private_attributes')

module.exports = async (params, usersIds) => {
  // Allow to pass users ids either through the params object
  // or as an additional argument
  if (!usersIds) usersIds = params.users
  const { reqUserId } = params

  // There is room for optimization here, as we are fetching all document
  // to return just a fraction of it. More filtering could be done at the view level,
  // possibly using CouchDB Mango queries to let the database handle the filtering
  // and pagination in a possibly much more efficient way
  const foundItems = await items_.byOwners(usersIds)
  const authorizedItems = await filterVisibleDocs(foundItems, reqUserId)
  const page = Paginate(params)(authorizedItems)
  page.items = page.items.map(filterPrivateAttributes(reqUserId))
  return addAssociatedData(page, params)
}
