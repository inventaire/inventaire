/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const CONFIG = require('config');
const __ = require('config').universalPath;
const _ = __.require('builders', 'utils');
const crypto_ = __.require('lib', 'crypto');

module.exports = function(data){
  const fingerPrint = getFingerPrint(data);
  // If we have a user id, the user is logged in
  if (data.userId != null) { return onlineUsers[fingerPrint] = 1;
  } else { return onlineUsers[fingerPrint] = 0; }
};

var onlineUsers = {};
let last = null;

const updateOnlineUsers = function() {
  const length = _.objLength(onlineUsers);
  const loggedUsers = _.sumValues(onlineUsers);
  const report = `logged in ${loggedUsers} / total ${length}`;

  // Only log the amount of users online when there is a change
  if (report !== last) { _.info(report); }
  last = report;
  return onlineUsers = {};
};

var getFingerPrint = function(...args){
  const str = JSON.stringify(args);
  return crypto_.md5(str);
};

setInterval(updateOnlineUsers, 30 * 1000);
