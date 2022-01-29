const _ = require('builders/utils')
const error_ = require('lib/error/error')
const entities_ = require('./entities')
const retryOnConflict = require('lib/retry_on_conflict')
const updateLabel = require('./update_label')

const updateInvLabel = async (user, id, lang, value) => {
  const { _id: reqUserId } = user

  if (!_.isInvEntityId(id)) throw error_.newInvalid('id', id)

  const entity = await entities_.byId(id)
  return updateLabel(lang, value, reqUserId, entity)
}

module.exports = retryOnConflict({ updateFn: updateInvLabel })
