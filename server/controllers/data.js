const __ = require('config').universalPath
const ActionsControllers = __.require('lib', 'actions_controllers')

module.exports = {
  get: ActionsControllers({
    public: {
      'wp-extract': __.require('data', 'wikipedia/extract'),
      isbn: __.require('data', 'isbn'),
      'entity-type-aliases': __.require('data', 'entity_type_aliases')
    }
  })
}
