/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS103: Rewrite code to no longer use __guard__
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const CONFIG = require('config');
const __ = require('config').universalPath;
const _ = __.require('builders', 'utils');
const onlineUsers = require('./lib/online_users');
const responses_ = __.require('lib', 'responses');

module.exports = function(req, res){
  const { headers } = req;
  const { 'user-agent':userAgent } = headers;

  // Excluding bots from online counts
  if (isBot(userAgent)) { return _.ok(res); }

  onlineUsers({
    userId: (req.user != null ? req.user._id : undefined),
    // For production, when behind a Nginx proxy
    ip: headers['x-forwarded-for'],
    userAgent: headers['user-agent'],
    lang: __guard__(headers['accept-language'] != null ? headers['accept-language'].split(',') : undefined, x => x[0])});

  return responses_.ok(res);
};

// In production, bots should be routed to use prerender
// cf https://github.com/inventaire/inventaire-deploy/blob/f3cda7210d29d9b3bfb983f8fbb1106c43c18968/nginx/inventaire.original.nginx#L160
var isBot = userAgent => /prerender/.test(userAgent);

function __guard__(value, transform) {
  return (typeof value !== 'undefined' && value !== null) ? transform(value) : undefined;
}