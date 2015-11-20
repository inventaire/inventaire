CONFIG = require 'config'
__ = CONFIG.universalPath
{ membershipActionsList } = __.require 'models', 'group'

otherActions = [ 'updateSettings' ]

module.exports =
  possibleActions: membershipActionsList.concat otherActions
