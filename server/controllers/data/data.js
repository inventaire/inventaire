import ActionsControllers from 'lib/actions_controllers'

export default {
  get: ActionsControllers({
    public: {
      'wp-extract': require('./wp_extract'),
      summaries: require('./summaries'),
      isbn: require('./isbn'),
      'property-values': require('./property_values')
    }
  })
}
