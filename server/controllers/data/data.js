const ActionsControllers = require('lib/actions_controllers')

module.exports = {
  get: ActionsControllers({
    public: {
      'wp-extract': require('./wp_extract'),
      summaries: require('./summaries'),
      isbn: require('./isbn'),
      'property-values': require('./property_values')
    }
  })
}
