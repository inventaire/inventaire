CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
ActionsControllers = __.require 'lib', 'actions_controllers'

module.exports =
  get: ActionsControllers
    authentified:
      'data-url': require './data_url'

  post: ActionsControllers
    authentified:
      'upload': require './upload'
      'convert-url': require './convert_url'
