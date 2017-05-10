CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
ActionsControllers = __.require 'lib', 'actions_controllers'

module.exports =
  post: ActionsControllers
    authentified:
      'upload': require './upload'
      'convert-url': require './convert_url'
