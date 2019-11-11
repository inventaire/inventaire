/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
let API;
const CONFIG = require('config');
const __ = CONFIG.universalPath;
const _ = __.require('builders', 'utils');
const { Promise } = __.require('lib', 'promises');
const { createUser } = require('./users');
const { createRandomizedItems } = require('./items');

let populatePromise = null;
const usersCount = 8;
const publicItemsPerUser = 10;

module.exports = (API = {
  populate() {
    if (populatePromise != null) { return populatePromise; }
    populatePromise = Promise.all(_.times(usersCount, API.createUserWithItems));
    return populatePromise;
  },

  createUserWithItems() {
    const userPromise = createUser();
    return userPromise
    .then(function() {
      const itemsData = _.times(publicItemsPerUser, () => ({
        listing: 'public'
      }));
      return createRandomizedItems(userPromise, itemsData);}).then(() => userPromise);
  }
});
