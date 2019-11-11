/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const CONFIG = require('config');
const __ = require('config').universalPath;
const _ = __.require('builders', 'utils');
const user_ = __.require('controllers', 'user/lib/user');
const promises_ = __.require('lib', 'promises');

module.exports = (userId, authentifiedUserPromise) => promises_.all([
  user_.byId(userId),
  getAccessLevel(userId, authentifiedUserPromise)
])
.spread((user, getAccessLevel) => ({
  users: [ user ],
  accessLevel: getAccessLevel,

  feedOptions: {
    title: user.username,
    description: user.bio,
    image: user.picture,
    queryString: `user=${user._id}`,
    pathname: `inventory/${user._id}`
  }
}));

var getAccessLevel = (userId, authentifiedUserPromise) => authentifiedUserPromise
.then(function(requester){
  if (requester == null) { return 'public'; }

  const requesterId = requester._id;

  if (requesterId === userId) { return 'private'; }

  return user_.areFriendsOrGroupCoMembers(userId, requester._id)
  .then(function(bool){ if (bool) { return 'network'; } else { return 'public'; } });
});
