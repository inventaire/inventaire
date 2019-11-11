/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const CONFIG = require('config');
const __ = CONFIG.universalPath;
const _ = __.require('builders', 'utils');
const should = require('should');
const { nonAuthReq, undesiredRes, getUser } = require('../utils/utils');
const endpoint = '/api/auth?action=reset-password';
const randomString = __.require('lib', './utils/random_string');

describe('auth:reset-password', function() {
  it('should reject requests without email', function(done){
    nonAuthReq('post', endpoint, {})
    .then(undesiredRes(done))
    .catch(function(err){
      err.body.status_verbose.should.equal('missing parameter in body: email');
      return done();}).catch(done);

  });

  return it('should send a reset password email', function(done){
    getUser()
    .then(user => nonAuthReq('post', endpoint, { email: user.email }))
    .then(function(res){
      res.ok.should.be.true();
      return done();}).catch(done);

  });
});
