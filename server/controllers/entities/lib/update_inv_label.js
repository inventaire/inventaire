const __ = require('config').universalPath
const _ = __.require('builders', 'utils')
const error_ = __.require('lib', 'error/error')
const entities_ = require('./entities')
const radio = __.require('lib', 'radio')
const retryOnConflict = __.require('lib', 'retry_on_conflict')
const updateLabel = require('./update_label')

const updateInvLabel = (user, id, lang, value) => {
  const { _id: reqUserId } = user

  if (!_.isInvEntityId(id)) return error_.rejectInvalid('id', id)

  return entities_.byId(id)
  .then(updateLabel.bind(null, lang, value, reqUserId))
  .then(updatedDoc => radio.emit('entity:update:label', updatedDoc, lang, value))
}

module.exports = retryOnConflict({ updateFn: updateInvLabel })
