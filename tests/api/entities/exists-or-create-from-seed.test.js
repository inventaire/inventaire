/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const CONFIG = require('config');
const __ = CONFIG.universalPath;
const _ = __.require('builders', 'utils');
const should = require('should');
const { nonAuthReq, authReq, undesiredErr } = require('../utils/utils');
const { generateIsbn13, humanName, randomLabel } = require('../fixtures/entities');

describe('entities:exists-or-create-from-seed', function() {
  it('should reject if params isbn is missing', function(done){
    authReq('post', '/api/entities?action=exists-or-create-from-seed')
    .catch(function(err){
      err.body.status_verbose.should.startWith('missing parameter');
      return done();}).catch(undesiredErr(done));

  });

  it('should reject if params title is missing', function(done){
    authReq('post', '/api/entities?action=exists-or-create-from-seed',
      {isbn: generateIsbn13()})
    .catch(function(err){
      err.body.status_verbose.should.startWith('missing parameter');
      return done();}).catch(undesiredErr(done));

  });

  it('should reject if authors is not a string', function(done){
    authReq('post', '/api/entities?action=exists-or-create-from-seed', {
      isbn: generateIsbn13(),
      title: randomLabel(),
      authors: 1
    }).catch(function(err){
      err.body.status_verbose.should.startWith('invalid authors');
      return done();}).catch(undesiredErr(done));

  });

  it('should reject if isbn is invalid', function(done){
    authReq('post', '/api/entities?action=exists-or-create-from-seed', {
      isbn: '000000',
      title: randomLabel()
    }).catch(function(err){
      err.body.status_verbose.should.startWith('invalid isbn');
      return done();}).catch(undesiredErr(done));

  });

  it('should accept if params authors is missing', function(done){
    authReq('post', '/api/entities?action=exists-or-create-from-seed', {
      isbn: generateIsbn13(),
      title: randomLabel()
    }).then(function(res){
      res._id.should.be.a.String();
      return done();}).catch(undesiredErr(done));

  });

  return it('should create an edition and a work from seed', function(done){
    authReq('post', '/api/entities?action=exists-or-create-from-seed', {
      isbn: generateIsbn13(),
      title: randomLabel(),
      authors: [ randomLabel() ]
    })
    .then(function(res){
      res._id.should.be.a.String();
      const workUri = res.claims['wdt:P629'][0];
      return authReq('get', `/api/entities?action=by-uris&uris=${workUri}`)
      .get('entities')
      .then(function(entities){
        entities[workUri].should.be.an.Object();
        return done();
      });}).catch(undesiredErr(done));

  });
});
