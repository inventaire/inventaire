const _ = require('builders/utils')
const selections_ = require('controllers/lists/lib/selections')
const filterVisibleDocs = require('lib/filter_visible_docs')
const lists_ = require('controllers/lists/lib/lists')

const sanitization = {
  uris: { },
}

const controller = async ({ reqUserId, uris }) => {
  const foundSelections = await selections_.byEntities(uris)
  // uniq here implies that a list cannot refer several times to the same entity
  const listsIds = _.uniq(_.map(foundSelections, 'list'))
  const foundLists = await lists_.byIdsWithSelections(listsIds, reqUserId)
  const authorizedLists = await filterVisibleDocs(foundLists, reqUserId)
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
  if (listsSelections && listsSelections.length === 0) {
    listsByUris[uri] = []
    return
  }
  const listsByIds = _.keyBy(lists, '_id')
  if (_.isNonEmptyPlainObject(listsByIds)) {
    listsByUris[uri] = Object.values(listsByIds)
  }
  return listsByUris
}
