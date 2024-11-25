import { actionsControllersFactory } from '#lib/actions_controllers'
import create from './create.js'
import getUserGroups from './get_user_groups.js'
import membersActions from './members_actions.js'
import publicActions from './public_actions.js'
import updateSettings from './update_settings.js'

export default {
  get: actionsControllersFactory({
    public: {
      'by-id': publicActions.byId,
      'by-slug': publicActions.bySlug,
      'search-by-position': publicActions.searchByPositon,
      slug: publicActions.slug,
    },
    authentified: {
      default: getUserGroups,
    },
  }),

  post: actionsControllersFactory({
    authentified: {
      create,
    },
  }),

  put: actionsControllersFactory({
    authentified: {
      invite: membersActions('invite'),
      accept: membersActions('accept'),
      decline: membersActions('decline'),
      request: membersActions('request'),
      'cancel-request': membersActions('cancelRequest'),
      'accept-request': membersActions('acceptRequest'),
      'refuse-request': membersActions('refuseRequest'),
      'make-admin': membersActions('makeAdmin'),
      kick: membersActions('kick'),
      leave: membersActions('leave'),
      'update-settings': updateSettings,
    },
  }),
}
