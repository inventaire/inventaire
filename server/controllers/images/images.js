const CONFIG = require('config');
const __ = CONFIG.universalPath;
const _ = __.require('builders', 'utils');
const ActionsControllers = __.require('lib', 'actions_controllers');

module.exports = {
  get: ActionsControllers({
    authentified: {
      'data-url': require('./data_url')
    }
  }),

  post: ActionsControllers({
    authentified: {
      'upload': require('./upload'),
      'convert-url': require('./convert_url')
    }
  })
};
