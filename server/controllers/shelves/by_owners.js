import _ from 'builders/utils'
import { filterPrivateAttributes } from 'controllers/shelves/lib/filter_private_attributes'
import shelves_ from 'controllers/shelves/lib/shelves'
import filterVisibleDocs from 'lib/visibility/filter_visible_docs'

const sanitization = {
  owners: {},
  limit: { optional: true },
  offset: { optional: true }
}

const controller = async params => {
  const { reqUserId, owners } = params
  const foundShelves = await shelves_.byOwners(owners)
  let authorizedShelves = await filterVisibleDocs(foundShelves, reqUserId)
  authorizedShelves = authorizedShelves.map(filterPrivateAttributes(reqUserId))
  const shelves = _.keyBy(authorizedShelves, '_id')
  return { shelves }
}

export default { sanitization, controller }
