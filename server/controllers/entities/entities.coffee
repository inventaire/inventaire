__ = require('config').universalPath
ActionsControllers = __.require 'lib', 'actions_controllers'
customQuery = require './custom_query'

module.exports =
  get: ActionsControllers
    public:
      'search': require './search'
      'by-uris': require './by_uris'
      'changes': require './changes'
      'reverse-claims': require './reverse_claims'
      'author-works': customQuery
      'serie-parts': customQuery
      'history': require './history'
      'images': require './images'
      'popularity': require './popularity'
    admin:
      'contributions': require './contributions'
      'duplicates': require './duplicates'
      'activity': require './activity'

  post: ActionsControllers
    public:
      'by-uris': require './by_uris'
    authentified:
      'create': require './create'
      'exists-or-create-from-seed': require './exists_or_create_from_seed'
    admin:
      'delete-by-uris': require './delete_by_uris'

  put: ActionsControllers
    authentified:
      'update-claim': require './update_claim'
      'update-label': require './update_label'
      'move-to-wikidata': require './move_to_wikidata'
    admin:
      'merge': require './merge'
      'revert-merge': require './revert_merge'
