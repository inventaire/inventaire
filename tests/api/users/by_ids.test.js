/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const CONFIG = require('config');
const __ = CONFIG.universalPath;
const _ = __.require('builders', 'utils');
const should = require('should');
const { nonAuthReq, getUser, undesiredErr } = require('../utils/utils');

describe('users:by-ids', () => it('should get a user', function(done){
  getUser()
  .then(function(user){
    const userId = user._id;
    return nonAuthReq('get', `/api/users?action=by-ids&ids=${userId}`)
    .then(function(res){
      res.users.should.be.an.Object();
      res.users[userId].should.be.an.Object();
      res.users[userId]._id.should.equal(userId);
      return done();
    });}).catch(undesiredErr(done));

}));
