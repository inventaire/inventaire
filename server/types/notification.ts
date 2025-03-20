import type { groupAttributeWithNotification } from '#controllers/notifications/lib/group_update'
import type { CouchDoc, CouchUuid } from '#types/couchdb'
import type { GroupId } from '#types/group'
import type { UserId } from '#types/user'

export type NotificationId = CouchUuid

interface NotificationBase extends CouchDoc {
  _id: NotificationId
  status: 'unread' | 'read'
  time: EpochTimeStamp
  // The user to notify
  user: UserId
}

export interface FriendAcceptedRequestNotification extends NotificationBase {
  type: 'friendAcceptedRequest'
  data: {
    // The user that accepted the request
    user: UserId
  }
}

export interface GroupUpdateNotification extends NotificationBase {
  type: 'groupUpdate'
  data: {
    group: GroupId
    // The group admin that made the update
    user: UserId
    attribute: typeof groupAttributeWithNotification[number]
    previousValue: string | boolean
    newValue: string | boolean
  }
}

export interface UserMadeAdminNotification extends NotificationBase {
  type: 'userMadeAdmin'
  data: {
    group: GroupId
    // The group admin that made the update
    user: UserId
  }
}

export type NotificationByType = {
  'friendAcceptedRequest': FriendAcceptedRequestNotification
  'groupUpdate': GroupUpdateNotification
  'userMadeAdmin': UserMadeAdminNotification
}

export type NotificationType = keyof NotificationByType
export type Notification = NotificationByType[NotificationType]

export type NotificationSubjectId = UserId | GroupId
