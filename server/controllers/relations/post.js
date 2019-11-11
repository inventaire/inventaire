/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const __ = require('config').universalPath;
const _ = __.require('builders', 'utils');
const user_ = __.require('controllers', 'user/lib/user');
const intent = require('./lib/intent');
const error_ = __.require('lib', 'error/error');
const responses_ = __.require('lib', 'responses');
const promises_ = __.require('lib', 'promises');
const { Track } = __.require('lib', 'track');

module.exports = function(req, res, next){
  if (req.user == null) { return error_.unauthorizedApiAccess(req, res); }

  const { user, action } = req.body;

  if (!_.isString(action) || !possibleActions.includes(action)) {
    return error_.bundle(req, res, 'bad actions parameter', 400, req.body);
  }
  if (!_.isUserId(user)) {
    return error_.bundle(req, res, 'bad user parameter', 400, req.body);
  }

  const reqUserId = req.user._id;

  return promises_.try(() => solveNewRelation(action, user, reqUserId))
  .then(_.success.bind(null, user, `${action}: OK!`))
  .then(responses_.Ok(res))
  .then(Track(req, ['relation', action]))
  .catch(error_.Handler(req, res));
};

var solveNewRelation = function(action, othersId, reqUserId){
  if (reqUserId === othersId) {
    throw error_.new('cant create relation between identical ids', 400, arguments);
  }

  const type = actions[action];
  return intent[type](reqUserId, othersId);
};

var actions = {
  request: 'requestFriend',
  cancel: 'cancelFriendRequest',
  accept: 'acceptRequest',
  discard: 'discardRequest',
  unfriend: 'removeFriendship'
};

var possibleActions = Object.keys(actions);
