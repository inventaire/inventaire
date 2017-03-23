__ = require('config').universalPath
ActionsControllers = __.require 'lib', 'actions_controllers'

module.exports =
  get: ActionsControllers
    public:
      'get-users': require './get_users_public_data'
      'search': require './search_by_text'
      'search-by-position': require './search_by_position'
    authentified:
      'nearby': require './nearby'
