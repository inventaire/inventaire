import ActionsControllers from '#lib/actions_controllers'

export default {
  get: ActionsControllers({
    public: {
      'by-ids': require('./clients_by_ids'),
    }
  })
}
