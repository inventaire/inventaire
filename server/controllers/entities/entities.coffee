__ = require('config').universalPath
ActionsControllers = __.require 'lib', 'actions_controllers'
customQuery = require './custom_query'

module.exports =
  # public
  get: ActionsControllers
    'search': require './search_entity'
    'get-entities': require './get_entities'
    'get-changes': require './get_changes'
    'reverse-claims': require './reverse_claims'
    'author-works': customQuery
    'serie-parts': customQuery

  # authentified
  post: require './create_entity'
  put: ActionsControllers
    'update-claim': require './update_claim'
    'update-label': require './update_label'

  admin:
    put: ActionsControllers
      'merge': require './merge'
