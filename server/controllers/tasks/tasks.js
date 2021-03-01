const __ = require('config').universalPath
const ActionsControllers = __.require('lib', 'actions_controllers')
const { bySuspectUris, bySuggestionUris } = require('./by_entity_uris')

module.exports = {
  get: ActionsControllers({
    public: {
      'by-ids': require('./by_ids'),
      'by-score': require('./by_score'),
      'by-entities-type': require('./by_entities_type'),
      'by-suspect-uris': bySuspectUris,
      'by-suggestion-uris': bySuggestionUris
    }
  }),

  post: ActionsControllers({
    authentified: {
      'deduplicate-works': require('./deduplicate_works')
    },
    admin: {
      'collect-entities': require('./collect_entities'),
      'check-entities': require('./check_entities')
    }
  }),

  put: ActionsControllers({
    admin: {
      update: require('./update')
    }
  })
}

require('./hooks')()
