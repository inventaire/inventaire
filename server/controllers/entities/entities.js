const ActionsControllers = require('lib/actions_controllers')
const { authorWorks, serieParts, publisherPublications } = require('./get_entity_relatives')

module.exports = {
  get: ActionsControllers({
    public: {
      'by-uris': require('./by_uris_get'),
      'reverse-claims': require('./reverse_claims'),
      'author-works': authorWorks,
      'serie-parts': serieParts,
      'publisher-publications': publisherPublications,
      images: require('./images'),
      popularity: require('./popularity'),
      history: require('./history')
    },
    dataadmin: {
      duplicates: require('./duplicates')
    },
    admin: {
      activity: require('./activity'),
      contributions: require('./contributions')
    }
  }),

  post: ActionsControllers({
    public: {
      'by-uris': require('./by_uris_get')
    },
    authentified: {
      create: require('./create'),
      resolve: require('./resolve'),
      delete: require('./delete')
    }
  }),

  put: ActionsControllers({
    authentified: {
      'update-claim': require('./update_claim'),
      'update-label': require('./update_label'),
      'revert-edit': require('./revert_edit'),
      'move-to-wikidata': require('./move_to_wikidata')
    },
    dataadmin: {
      merge: require('./merge'),
      'revert-merge': require('./revert_merge')
    }
  })
}
