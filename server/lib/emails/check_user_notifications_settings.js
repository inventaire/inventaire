/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const __ = require('config').universalPath;
const error_ = __.require('lib', 'error/error');

module.exports = function(user, notificationLabel){
  const { _id, settings, undeliveredEmail } = user;
  if (undeliveredEmail > 1) {
    throw emailDisabled({ user: _id, reason: 'too many undelivered emails' });
  }

  const { notifications } = settings;
  checkSetting(_id, notifications, 'global');
  return checkSetting(_id, notifications, notificationLabel);
};

var checkSetting = function(userId, notifications, label){
  // settings might be undefined, defaulting to true (activated)
  if (notifications[label] === false) {
    throw emailDisabled({
      user: userId,
      notification: label
    });
  }
};

var emailDisabled = context => error_.new('email disabled', 'email_disabled', context);
