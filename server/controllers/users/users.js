import byCreationDate from '#controllers/users/by_creation_date'
import ActionsControllers from '#lib/actions_controllers'
import byIds from './by_ids.js'
import byUsernames from './by_usernames.js'
import nearby from './nearby.js'
import searchByPosition from './search_by_position.js'
import searchByText from './search_by_text.js'

export default {
  get: ActionsControllers({
    public: {
      'by-ids': byIds,
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
  }),
}
