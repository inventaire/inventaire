const __ = require('config').universalPath
const _ = __.require('builders', 'utils')
const responses_ = __.require('lib', 'responses')
const error_ = __.require('lib', 'error/error')
const { Track } = __.require('lib', 'track')
const shelves_ = __.require('controllers', 'shelves/lib/shelves')
const sanitize = __.require('lib', 'sanitize/sanitize')
const { isMember } = __.require('controllers', 'groups/lib/membership_validations')

const sanitization = {
  id: {},
  items: {},
  group: { optional: true }
}

const itemsActions = action => (req, res, next) => {
  sanitize(req, res, sanitization)
  .then(validateAndMakeAction(action))
  .then(_.KeyBy('_id'))
  .then(responses_.Wrap(res, 'shelves'))
  .then(Track(req, [ 'shelf', action ]))
  .catch(error_.Handler(req, res))
}

module.exports = {
  addItems: itemsActions('addItems'),
  removeItems: itemsActions('removeItems')
}

const validateAndMakeAction = action => async ({ id, items, group, reqUserId }) => {
  if (group) await isMember(reqUserId, group)
  return shelves_[action]([ id ], items, reqUserId)
}
