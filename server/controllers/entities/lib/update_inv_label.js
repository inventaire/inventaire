// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const __ = require('config').universalPath
const _ = __.require('builders', 'utils')
const entities_ = require('./entities')
const radio = __.require('lib', 'radio')
const retryOnConflict = __.require('lib', 'retry_on_conflict')
const updateLabel = require('./update_label')

const updateInvLabel = function(user, id, lang, value){
  const { _id:reqUserId } = user

  if (!_.isInvEntityId(id)) { return error_.rejectInvalid('id', id) }

  return entities_.byId(id)
  .then(updateLabel.bind(null, lang, value, reqUserId))
  .then(updatedDoc => radio.emit('entity:update:label', updatedDoc, lang, value))
}

module.exports = retryOnConflict({ updateFn: updateInvLabel })
