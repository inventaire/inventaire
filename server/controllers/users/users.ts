import byAccts from '#controllers/users/by_accts'
import byCreationDate from '#controllers/users/by_creation_date'
import { methodAndActionsControllersFactory } from '#lib/actions_controllers'
import type { EndpointSpecs } from '#types/api/specifications'
import byAnonymizableIds from './by_anonymizable_ids.js'
import byIds from './by_ids.js'
import byUsernames from './by_usernames.js'
import nearby from './nearby.js'
import searchByPosition from './search_by_position.js'
import searchByText from './search_by_text.js'

const methodsAndActionsControllers = {
  get: {
    public: {
      'by-ids': byIds,
      'by-accts': byAccts,
      'by-anonymizable-ids': byAnonymizableIds,
      'by-usernames': byUsernames,
      search: searchByText,
      'search-by-position': searchByPosition,
    },
    authentified: {
      // TODO: maybe, merge this endpoint with search-by-position
      nearby,
    },
    admin: {
      'by-creation-date': byCreationDate,
    },
  },
}

export default methodAndActionsControllersFactory(methodsAndActionsControllers)

export const specs: EndpointSpecs = {
  name: 'users',
  description: 'Get/find other users data',
  controllers: methodsAndActionsControllers,
}
