const ActionsControllers = require('lib/actions_controllers')

module.exports = {
  get: ActionsControllers({
    public: {
      'wp-extract': require('data/wikipedia/extract'),
      isbn: require('data/isbn'),
      'property-values': require('data/property_values')
    }
  })
}
