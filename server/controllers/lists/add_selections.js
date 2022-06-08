const lists_ = require('controllers/lists/lib/lists')
const error_ = require('lib/error/error')

const sanitization = {
  id: {},
  uris: {}
}

const controller = async ({ id, uris, reqUserId }) => {
  const list = await lists_.getListWithSelections(id, uris, reqUserId)
  if (!list) throw error_.notFound({ id })
  lists_.validateOwnership(reqUserId, list)
  return lists_.addSelections({ list, uris, userId: reqUserId })
}

module.exports = {
  sanitization,
  controller,
  track: [ 'list', 'addSelections' ]
}
