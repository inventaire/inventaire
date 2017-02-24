__ = require('config').universalPath
ActionsControllers = __.require 'lib', 'actions_controllers'

module.exports =
  publicActions: ActionsControllers
    'get-users': require './get_users_public_data'
    'search': require './search_by_username'
    'search-by-position': require './search_by_position'

  actions: ActionsControllers
    'nearby': require './nearby'
