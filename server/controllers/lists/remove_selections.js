const _ = require('builders/utils')
const lists_ = require('controllers/lists/lib/lists')
const { filterFoundSelectionsUris } = require('controllers/lists/lib/helpers')
const error_ = require('lib/error/error')
const selections_ = require('controllers/lists/lib/selections')
const { addWarning } = require('lib/responses')

const sanitization = {
  id: {},
  uris: {}
}

const controller = async ({ id, uris, reqUserId }, req, res) => {
  const list = await lists_.getListWithSelections(id, reqUserId)
  if (!list) throw error_.notFound({ id })

  lists_.validateOwnership(reqUserId, list)

  const selectionsToDelete = []
  const notFoundUris = []
  filterFoundSelectionsUris(list.selections, uris, selectionsToDelete, notFoundUris)
  if (selectionsToDelete.length === 0) {
    throw error_.notFound({ uris })
  }
  await selections_.bulkDelete(selectionsToDelete)
  if (_.isNonEmptyArray(notFoundUris)) {
    addWarning(res, `entities uris not found in list: ${notFoundUris.join(', ')}`)
  }
  return { list }
}

module.exports = {
  sanitization,
  controller,
  track: [ 'list', 'deleteSelection' ]
}
