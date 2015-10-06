CONFIG = require 'config'
__ = CONFIG.root
{ membershipActionsList } = __.require 'models', 'group'

otherActions = [ 'updateSettings' ]

module.exports =
  possibleActions: membershipActionsList.concat otherActions
