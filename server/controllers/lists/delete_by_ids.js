const _ = require('builders/utils')
const lists_ = require('controllers/lists/lib/lists')
const selections_ = require('controllers/lists/lib/selections')

const sanitization = {
  ids: {},
}

const controller = async ({ ids, reqUserId }) => {
  const listsRes = await lists_.byIdsWithSelections(ids, reqUserId)
  const lists = _.compact(listsRes)
  lists_.validateOwnership(reqUserId, lists)
  const deletedSelections = await selections_.deleteListsSelections(lists)
  await lists_.bulkDelete(lists)
  return {
    ok: true,
    lists,
    selections: deletedSelections,
  }
}

module.exports = {
  sanitization,
  controller,
  track: [ 'list', 'deletion' ]
}
