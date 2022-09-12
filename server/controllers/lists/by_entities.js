const _ = require('builders/utils')
const selections_ = require('controllers/lists/lib/selections')
const filterVisibleDocs = require('lib/visibility/filter_visible_docs')
const lists_ = require('controllers/lists/lib/lists')
const { paginate } = require('controllers/items/lib/queries_commons')
const { isNonEmptyArray } = require('lib/boolean_validations')

const sanitization = {
  uris: { },
  limit: { optional: true },
  offset: { optional: true }
}

const controller = async ({ uris, offset, limit, reqUserId }) => {
  const foundSelections = await selections_.byEntities(uris)
  // uniq here implies that a list cannot refer several times to the same entity
  const listsIds = _.uniq(_.map(foundSelections, 'list'))
  const foundLists = await lists_.byIdsWithSelections(listsIds, reqUserId)
  const lists = await filterVisibleDocs(foundLists, reqUserId)
  const { items: authorizedLists } = paginate(lists, { offset, limit })
  const listsByUris = {}
  const selectionsByUris = _.groupBy(foundSelections, 'uri')
  uris.forEach(assignListsByUris(authorizedLists, selectionsByUris, listsByUris))
  return {
    lists: listsByUris
  }
}

module.exports = { sanitization, controller }

const assignListsByUris = (lists, selectionsByUris, listsByUris) => uri => {
  const listsSelections = selectionsByUris[uri]
  if (!isNonEmptyArray(listsSelections)) {
    listsByUris[uri] = []
    return
  }
  const listsByIds = _.keyBy(lists, '_id')
  if (_.isNonEmptyPlainObject(listsByIds)) {
    listsByUris[uri] = Object.values(listsByIds)
  }
  return listsByUris
}
