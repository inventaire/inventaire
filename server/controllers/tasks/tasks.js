import { initTasksHooks } from '#controllers/tasks/hooks'
import ActionsControllers from '#lib/actions_controllers'
import byEntitiesType from './by_entities_type.js'
import { bySuspectUris, bySuggestionUris } from './by_entity_uris.js'
import byIds from './by_ids.js'
import byScore from './by_score.js'
import checkEntities from './check_entities.js'
import collectEntities from './collect_entities.js'
import deduplicateWorks from './deduplicate_works.js'
import update from './update.js'

export default {
  get: ActionsControllers({
    public: {
      'by-ids': byIds,
      'by-score': byScore,
      'by-entities-type': byEntitiesType,
      'by-suspect-uris': bySuspectUris,
      'by-suggestion-uris': bySuggestionUris,
    },
  }),

  post: ActionsControllers({
    authentified: {
      'deduplicate-works': deduplicateWorks,
    },
    admin: {
      'collect-entities': collectEntities,
      'check-entities': checkEntities,
    },
  }),

  put: ActionsControllers({
    admin: {
      update,
    },
  }),
}

initTasksHooks()
