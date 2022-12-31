import ActionsControllers from 'lib/actions_controllers'
import { authorWorks, serieParts, publisherPublications } from './get_entity_relatives'

export default {
  get: ActionsControllers({
    public: {
      'by-uris': require('./by_uris_get'),
      'reverse-claims': require('./reverse_claims'),
      'author-works': authorWorks,
      'serie-parts': serieParts,
      'publisher-publications': publisherPublications,
      images: require('./images'),
      popularity: require('./popularity'),
      history: require('./history'),
      contributions: require('./contributions')
    },
    dataadmin: {
      duplicates: require('./duplicates')
    },
    admin: {
      'contributions-count': require('./contributions_count'),
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
      'restore-version': require('./restore_version'),
      'move-to-wikidata': require('./move_to_wikidata')
    },
    dataadmin: {
      merge: require('./merge'),
      'revert-merge': require('./revert_merge')
    }
  })
}
