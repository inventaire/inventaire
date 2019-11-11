/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const { cookieMaxAge } = require('config');

// used to trigger logged in UI on the client-side
module.exports = res => res.cookie('loggedIn', true,
  {maxAge: cookieMaxAge});
