__ = require('config').universalPath
_ = __.require 'builders', 'utils'

ActionsControllers = __.require 'lib', 'actions_controllers'

module.exports =
  get: ActionsControllers
    public:
      'collect-entities': require './collect_entities'
      'by-score': require './by_score'
      'calculate-relation-score': require './calculate_relation_score'

  post: ActionsControllers
    public:
      'create': require './create'

  put: ActionsControllers
    authentified:
      'update': require './update'
