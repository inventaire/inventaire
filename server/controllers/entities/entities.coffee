__ = require('config').universalPath
ActionsControllers = __.require 'lib', 'actions_controllers'
customQuery = require './custom_query'

module.exports =
  get: ActionsControllers
    public:
      'search': require './search'
      'search-local': require './search_local'
      'by-uris': require './by_uris'
      'changes': require './changes'
      'reverse-claims': require './reverse_claims'
      'author-works': customQuery
      'serie-parts': customQuery
      'history': require './history'

  post: ActionsControllers
    authentified:
      'create': require './create'
      'exists-or-create-from-seed': require './exists_or_create_from_seed'

  put: ActionsControllers
    authentified:
      'update-claim': require './update_claim'
      'update-label': require './update_label'
    admin:
      'merge': require './merge'
      'revert-merge': require './revert_merge'
