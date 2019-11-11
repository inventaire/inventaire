/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
module.exports = function(userId, otherId, status){
  switch (status) {
    case 'friends': return 'friends';
    case 'a-requested':
      if (userId < otherId) { return 'userRequested';
      } else { return 'otherRequested'; }
    case 'b-requested':
      if (userId < otherId) { return 'otherRequested';
      } else { return 'userRequested'; }
    default: return 'none';
  }
};
