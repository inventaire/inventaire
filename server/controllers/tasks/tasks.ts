import { initTasksHooks } from '#controllers/tasks/hooks'
import ActionsControllers from '#lib/actions_controllers'
import byEntitiesType from './by_entities_type'
import { bySuspectUris, bySuggestionUris } from './by_entity_uris'
import byIds from './by_ids'
import byScore from './by_score'
import checkHumanDuplicates from './check_human_duplicates'
import collectHumanDuplicates from './collect_human_duplicates'
import deduplicateWorks from './deduplicate_works'
import update from './update'

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
