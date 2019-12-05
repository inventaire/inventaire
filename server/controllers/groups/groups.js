const CONFIG = require('config')
const __ = CONFIG.universalPath
const responses_ = __.require('lib', 'responses')
const error_ = __.require('lib', 'error/error')
const publicActions = require('./public_actions')
const { allUserGroups } = require('./lib/groups')
const ActionsControllers = __.require('lib', 'actions_controllers')
const membersActions = require('./members_actions')
const requestActions = require('./request_actions')

module.exports = {
  get: ActionsControllers({
    public: {
      'by-id': publicActions.byId,
      'by-slug': publicActions.bySlug,
      search: publicActions.searchByText,
      'search-by-position': publicActions.searchByPositon,
      last: publicActions.lastGroups,
      slug: publicActions.slug
    },
    authentified: {
      default: (req, res) => {
        return allUserGroups(req.user._id)
        .then(responses_.Wrap(res, 'groups'))
        .catch(error_.Handler(req, res))
      }
    }
  }),

  post: ActionsControllers({
    authentified: {
      create: require('./create')
    }
  }),

  put: ActionsControllers({
    authentified: {
      invite: require('./invite'),
      accept: membersActions('accept'),
      decline: membersActions('decline'),
      request: require('./request'),
      'cancel-request': require('./cancel_request'),
      'accept-request': requestActions('accept'),
      'refuse-request': requestActions('refuse'),
      'make-admin': require('./make_admin'),
      kick: require('./update'),
      leave: require('./update'),
      'update-settings': require('./update')
    }
  })
}
