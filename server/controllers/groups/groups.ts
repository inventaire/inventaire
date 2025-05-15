import { methodAndActionsControllersFactory } from '#lib/actions_controllers'
import type { EndpointSpecs } from '#types/api/specifications'
import create from './create.js'
import getUserGroups from './get_user_groups.js'
import membersActions from './members_actions.js'
import publicActions from './public_actions.js'
import updateSettings from './update_settings.js'

const methodsAndActionsControllers = {
  get: {
    public: {
      'by-id': publicActions.byId,
      'by-slug': publicActions.bySlug,
      'search-by-position': publicActions.searchByPositon,
      slug: publicActions.slug,
    },
    authentified: {
      default: getUserGroups,
    },
  },

  post: {
    authentified: {
      create,
    },
  },

  put: {
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
  },
}

export default methodAndActionsControllersFactory(methodsAndActionsControllers)

export const specs: EndpointSpecs = {
  name: 'groups',
  description: 'Read and edit users groups data',
  externalDocs: {
    url: 'https://wiki.inventaire.io/wiki/Glossary#Group',
    description: 'Glossary',
  },
  controllers: methodsAndActionsControllers,
}
