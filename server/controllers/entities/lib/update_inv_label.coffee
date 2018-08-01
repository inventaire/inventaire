__ = require('config').universalPath
_ = __.require 'builders', 'utils'
entities_ = require './entities'
radio = __.require 'lib', 'radio'
retryOnConflict = __.require 'lib', 'retry_on_conflict'
updateLabel = require './update_label'

updateInvLabel = (user, id, lang, value)->
  { _id:reqUserId } = user

  unless _.isInvEntityId id then return error_.rejectInvalid 'id', id

  entities_.byId id
  .then updateLabel.bind(null, lang, value, reqUserId)
  .then (updatedDoc)-> radio.emit 'entity:update:label', updatedDoc, lang, value

module.exports = retryOnConflict updateInvLabel
