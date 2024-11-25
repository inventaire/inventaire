import { initTasksHooks } from '#controllers/tasks/hooks'
import { actionsControllersFactory } from '#lib/actions_controllers'
import byEntitiesType from './by_entities_type.js'
import { bySuspectUris, bySuggestionUris } from './by_entity_uris.js'
import byIds from './by_ids.js'
import byScore from './by_score.js'
import checkHumanDuplicates from './check_human_duplicates.js'
import collectHumanDuplicates from './collect_human_duplicates.js'
import deduplicateWorks from './deduplicate_works.js'
import getTasksCount from './get_tasks_count.js'
import update from './update.js'

export default {
  get: actionsControllersFactory({
    public: {
      'by-ids': byIds,
      'by-score': byScore,
      'by-entities-type': byEntitiesType,
      'by-uris': bySuspectUris,
      'by-suggestion-uris': bySuggestionUris,
      'tasks-count': getTasksCount,
    },
  }),

  post: actionsControllersFactory({
    authentified: {
      'deduplicate-works': deduplicateWorks,
    },
    admin: {
      // Endpoint with no automatic tests coverage that triggers a global check of local database entities,
      // it searches for wd:Q5 (human) duplicates and merge or create task accordingly
      'collect-human-duplicates': collectHumanDuplicates,
      'check-human-duplicates': checkHumanDuplicates,
    },
  }),

  put: actionsControllersFactory({
    admin: {
      update,
    },
  }),
}

initTasksHooks()
