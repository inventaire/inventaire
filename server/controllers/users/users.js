const __ = require('config').universalPath
const ActionsControllers = __.require('lib', 'actions_controllers')

module.exports = {
  get: ActionsControllers({
    public: {
      'by-ids': require('./by_ids'),
      'by-usernames': require('./by_usernames'),
      search: require('./search_by_text'),
      'search-by-position': require('./search_by_position')
    },
    authentified: {
      // TODO: maybe, merge this endpoint with search-by-position
      nearby: require('./nearby')
    }
  })
}
