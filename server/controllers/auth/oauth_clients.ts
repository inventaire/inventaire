import { actionsControllersFactory } from '#lib/actions_controllers'
import clientsByIds from './clients_by_ids.js'

export default {
  get: actionsControllersFactory({
    public: {
      'by-ids': clientsByIds,
    },
  }),
}
