// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
const CONFIG = require('config')
const __ = CONFIG.universalPath
const { membershipActionsList } = __.require('models', 'group')

const otherActions = [ 'updateSettings' ]

module.exports =
  { possibleActions: membershipActionsList.concat(otherActions) }
