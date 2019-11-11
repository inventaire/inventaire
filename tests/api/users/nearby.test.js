/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const CONFIG = require('config');
const __ = CONFIG.universalPath;
const _ = __.require('builders', 'utils');
const should = require('should');
const { getUserGetter, customAuthReq, undesiredErr } = __.require('apiTests', 'utils/utils');
const geolocatedUser1Promise = getUserGetter('geo1', false, { position: [ 1, 1 ] })().delay(2000);
const geolocatedUser2Promise = getUserGetter('geo2', false, { position: [ 40, 40 ] })().delay(2000);
const endpoint = '/api/users?action=nearby';

describe('users:nearby', function() {
  it('should get users nearby', function(done){
    geolocatedUser1Promise
    .then(user1 => customAuthReq(geolocatedUser2Promise, 'get', endpoint)
    .then(function(res){
      const usersIds = _.map(res.users, '_id');
      usersIds.includes(user1._id).should.be.true();
      return done();
    })).catch(undesiredErr(done));

  });

  return it('should accept a range', function(done){
    geolocatedUser1Promise
    .then(user1 => customAuthReq(geolocatedUser2Promise, 'get', `${endpoint}&range=1`)
    .then(function(res){
      const usersIds = _.map(res.users, '_id');
      usersIds.includes(user1._id).should.be.false();
      return done();
    })).catch(undesiredErr(done));

  });
});
