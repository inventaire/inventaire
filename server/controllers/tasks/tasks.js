import { initTasksHooks } from '#controllers/tasks/hooks'
import ActionsControllers from '#lib/actions_controllers'
import byEntitiesType from './by_entities_type.js'
import { bySuspectUris, bySuggestionUris } from './by_entity_uris.js'
import byIds from './by_ids.js'
import byScore from './by_score.js'
import checkHumanDuplicates from './check_human_duplicates.js'
import collectHumanDuplicates from './collect_human_duplicates.js'
import deduplicateWorks from './deduplicate_works.js'
import update from './update.js'

export default {
  get: ActionsControllers({
    public: {
      'by-ids': byIds,
      'by-score': byScore,
      'by-entities-type': byEntitiesType,
      'by-uris': bySuspectUris,
      'by-suggestion-uris': bySuggestionUris,
    },
  }),

  post: ActionsControllers({
    authentified: {
      'deduplicate-works': deduplicateWorks,
    },
    admin: {
      // Untested endpoint which triggers a global check of local database entities,
      // searching for wd:Q5 (human) duplicates and merge or create task accordingly
      'collect-human-duplicates': collectHumanDuplicates,
      'check-human-duplicates': checkHumanDuplicates,
    },
  }),

  put: ActionsControllers({
    admin: {
      update,
    },
  }),
}

initTasksHooks()
