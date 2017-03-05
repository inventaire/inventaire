__ = require('config').universalPath
ActionsControllers = __.require 'lib', 'actions_controllers'
customQuery = require './custom_query'

module.exports =
  get: ActionsControllers
    public:
      'search': require './search_entity'
      'get-entities': require './get_entities'
      'get-changes': require './get_changes'
      'reverse-claims': require './reverse_claims'
      'author-works': customQuery
      'serie-parts': customQuery
      'history': require './history'

  post: ActionsControllers
    authentified:
      'default': require './create_entity'
      'exists-or-create-from-seed': require './exists_or_create_from_seed'

  put: ActionsControllers
    authentified:
      'update-claim': require './update_claim'
      'update-label': require './update_label'
    admin:
      'merge': require './merge'
      'revert-merge': require './revert_merge'
