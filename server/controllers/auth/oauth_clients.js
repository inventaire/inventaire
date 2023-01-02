import ActionsControllers from '#lib/actions_controllers'
import clientsByIds from './clients_by_ids.js'

export default {
  get: ActionsControllers({
    public: {
      'by-ids': clientsByIds,
    },
  }),
}
