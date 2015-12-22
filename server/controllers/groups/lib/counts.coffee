module.exports = (groups_, _)->
  pendingGroupInvitationsCount: (userId)->
    groups_.byInvitedUser userId
    .then _.property('length')

  pendingGroupRequestsCount: (userId)->
    groups_.byAdmin userId
    .then _.property('length')
