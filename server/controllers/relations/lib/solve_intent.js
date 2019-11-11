/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const CONFIG = require('config');
const __ = CONFIG.universalPath;
const { godMode } = CONFIG;
const _ = __.require('builders', 'utils');

module.exports = function(actions){
  const API = {
    requestFriend(userId, otherId, status){
      // useful for development
      if (godMode) { return actions.forceFriendship(userId, otherId); }
      switch (status) {
        case 'none':
          return actions.makeRequest(userId, otherId);
        case 'otherRequested':
          return actions.simultaneousRequest(userId, otherId);
        default: return doNothing(status, 'requestFriend', userId, otherId);
      }
    },

    cancelFriendRequest(userId, otherId, status){
      switch (status) {
        case 'userRequested':
          return actions.removeRelation(userId, otherId);
        default: return doNothing(status, 'cancelFriendRequest', userId, otherId);
      }
    },

    removeFriendship(userId, otherId, status){
      switch (status) {
        case 'friends': case 'userRequested': case 'otherRequested':
          return actions.removeRelation(userId, otherId);
        default: return doNothing(status, 'removeFriendship', userId, otherId);
      }
    },

    acceptRequest(userId, otherId, status){
      switch (status) {
        case 'otherRequested':
          return actions.acceptRequest(userId, otherId);
        case 'none':
          return _.warn(`${userId} request to ${otherId} accepted after being cancelled`);
        default: return doNothing(status, 'acceptRequest', userId, otherId);
      }
    },

    discardRequest(userId, otherId, status){
      switch (status) {
        case 'otherRequested':
          return actions.removeRelation(userId, otherId);
        default: return doNothing(status, 'discardRequest', userId, otherId);
      }
    }
  };

  return API;
};

var doNothing = function(status, method, userId, otherId){
  _.warn(`Status mismatch: got status '${status}' \
at ${method} for relation ${userId}, ${otherId}. \
(it happens but it shouldn't be to often). \
Here, doing nothing is the best.`
  );
};
