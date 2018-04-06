__ = require('config').universalPath
_ = __.require 'builders', 'utils'

ActionsControllers = __.require 'lib', 'actions_controllers'

module.exports =
  get: ActionsControllers
    authentified:
      'by-ids': require './by_ids'
      'by-score': require './by_score'
      'by-suspect-uri': require './by_suspect_uri'

  post: ActionsControllers
    authentified:
      'collect-entities': require './collect_entities'

  put: ActionsControllers
    authentified:
      'update': require './update'
