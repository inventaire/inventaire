__ = require('config').universalPath
_ = __.require 'builders', 'utils'

ActionsControllers = __.require 'lib', 'actions_controllers'

module.exports =
  get: ActionsControllers
    authentified:
      'by-score': require './by_score'
      'by-suspect-uri': require './by_suspect_uri'

  post: ActionsControllers
    authentified:
      'collect-entities': require './collect_entities'
      'create': require './create'

  put: ActionsControllers
    authentified:
      'update': require './update'
      'update-relation-score': require './update_relation_score'
