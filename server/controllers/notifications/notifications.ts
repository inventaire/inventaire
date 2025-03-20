import acceptedRequest from '#controllers/notifications/lib/accepted_request'
import deleteNotifications from '#controllers/notifications/lib/delete_notifications'
import groupUpdate from '#controllers/notifications/lib/group_update'
import userMadeAdmin from '#controllers/notifications/lib/user_made_admin'
import { actionsControllersFactory } from '#lib/actions_controllers'
import { radio } from '#lib/radio'
import get from './get.js'
import { updateNotificationsStatus } from './update_status.js'

export default {
  get: actionsControllersFactory({
    authentified: {
      default: get,
    },
  }),
  post: actionsControllersFactory({
    authentified: {
      default: updateNotificationsStatus,
    },
  }),
}

radio.on('notify:friend:request:accepted', acceptedRequest)
radio.on('group:makeAdmin', userMadeAdmin)
radio.on('group:update', groupUpdate)
// Deleting notifications when their subject is deleted
// to avoid having notification triggering requests for deleted resources
radio.on('resource:destroyed', deleteNotifications)
