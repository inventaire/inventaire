__ = require('config').universalPath
ActionsControllers = __.require 'lib', 'actions_controllers'
{ fetchUsersNearby, fetchItemsNearby } = require './get_by_position'
fetchUsersItems = require './fetch_users_items'

module.exports =
  publicActions: ActionsControllers
    'get-users': require './get_users_public_data'
    'search': require './search_by_username'
    'search-by-position': require './search_by_position'

  actions: ActionsControllers
    'get-users-items': fetchUsersItems
    # letting 'get-items' as temporary legacy alias to 'get-users-items'
    'get-items': fetchUsersItems
    'get-users-nearby': fetchUsersNearby
    'get-items-nearby': fetchItemsNearby
