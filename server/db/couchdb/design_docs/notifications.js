export default {
  byUserAndTime: {
    map: doc => {
      emit([ doc.user, doc.time ], null)
    }
  },
  bySubject: {
    map: doc => {
      const { data } = doc
      emit(doc.user, 'user')
      if (data.user !== doc.user) emit(data.user, 'data:user')
      if (doc.type === 'groupUpdate' || doc.type === 'userMadeAdmin') {
        emit(data.group, 'data:group')
      }
    }
  },
  unreadNotificationsByGroupAndAttribute: {
    map: doc => {
      if (doc.type === 'groupUpdate' && doc.status === 'unread') {
        emit([ doc.data.group, doc.data.attribute ], null)
      }
    }
  }
}
