const _ = require('builders/utils')
const error_ = require('lib/error/error')
const entities_ = require('./entities')
const radio = require('lib/radio')
const retryOnConflict = require('lib/retry_on_conflict')
const updateLabel = require('./update_label')

const updateInvLabel = async (user, id, lang, value) => {
  const { _id: reqUserId } = user

  if (!_.isInvEntityId(id)) throw error_.newInvalid('id', id)

  return entities_.byId(id)
  .then(updateLabel.bind(null, lang, value, reqUserId))
  .then(updatedDoc => radio.emit('entity:update:label', updatedDoc, lang, value))
}

module.exports = retryOnConflict({ updateFn: updateInvLabel })
