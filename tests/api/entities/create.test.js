/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const CONFIG = require('config');
const __ = CONFIG.universalPath;
const _ = __.require('builders', 'utils');
const should = require('should');
const { nonAuthReq, authReq, undesiredRes, undesiredErr } = require('../utils/utils');
const { ensureEditionExists, humanName, randomLabel, someOpenLibraryId } = require('../fixtures/entities');

describe('entities:create', function() {
  it('should not be able to create an entity without a wdt:P31 value', function(done){
    authReq('post', '/api/entities?action=create', {
      labels: { de: humanName() },
      claims: { 'wdt:P50': [ 'wd:Q535' ] }
    })
    .catch(function(err){
      err.body.status_verbose.should.equal("wdt:P31 array can't be empty");
      return done();}).catch(undesiredErr(done));

  });

  it('should not be able to create an entity without a label (unless specific types)', function(done){
    authReq('post', '/api/entities?action=create', {
      labels: {},
      claims: { 'wdt:P31': [ 'wd:Q571' ] }
    })
    .catch(function(err){
      err.body.status_verbose.should.equal('invalid labels');
      return done();}).catch(undesiredErr(done));

  });

  it('should not be able to create an entity without a known valid wdt:P31 value', function(done){
    authReq('post', '/api/entities?action=create', {
      labels: { de: humanName() },
      claims: { 'wdt:P31': [ 'wd:Q535' ] }
    })
    .catch(function(err){
      err.body.status_verbose.should.equal("wdt:P31 value isn't a known valid value");
      return done();}).catch(undesiredErr(done));

  });

  it('should create an entity', function(done){
    authReq('post', '/api/entities?action=create', {
      labels: { fr: humanName() },
      claims: { 'wdt:P31': [ 'wd:Q571' ] }
    })
    .then(function(res){
      res._id.should.be.a.String();
      res._rev.should.be.a.String();
      return done();}).catch(undesiredErr(done));

  });

  it('should create an entity with a claim with a type specific validation', function(done){
    authReq('post', '/api/entities?action=create', {
      labels: { fr: humanName() },
      claims: { 'wdt:P31': [ 'wd:Q571' ], 'wdt:P648': [ someOpenLibraryId('work') ] }
    })
    .then(function(res){
      res._id.should.be.a.String();
      res._rev.should.be.a.String();
      return done();}).catch(undesiredErr(done));

  });

  it('should reject an entity with several values for a property that take one', function(done){
    authReq('post', '/api/entities?action=create', {
      labels: { fr: humanName() },
      claims: { 'wdt:P31': [ 'wd:Q571', 'wd:Q572' ] }
    })
    .catch(function(err){
      err.statusCode.should.equal(400);
      err.body.status_verbose.match(/expects a unique value/).should.be.ok();
      return done();}).catch(undesiredErr(done));

  });

  it('should reject invalid labels object', function(done){
    authReq('post', '/api/entities?action=create', {
      // Invalid labels type: array instead of object
      labels: [],
      claims: {}
    })
    .catch(function(err){
      err.body.status_verbose.should.equal('invalid labels: []');
      err.statusCode.should.equal(400);
      return done();}).catch(undesiredErr(done));

  });

  it('should reject invalid claims type: array instead of object', function(done){
    authReq('post', '/api/entities?action=create', {
      labels: {},
      claims: []
    })
    .catch(function(err){
      err.body.status_verbose.should.equal('invalid claims: []');
      err.statusCode.should.equal(400);
      return done();}).catch(undesiredErr(done));

  });

  it('should reject invalid claim property values', function(done){
    authReq('post', '/api/entities?action=create', {
      labels: { fr: humanName() },
      claims: {
        'wdt:P31': [ 'wd:Q571' ],
        'wdt:P50': 'wd:Q535'
      }
    }).catch(function(err){
      err.body.status_verbose.should.equal('invalid property values');
      err.statusCode.should.equal(400);
      return done();}).catch(undesiredErr(done));

  });

  it('should reject invalid claim property', function(done){
    authReq('post', '/api/entities?action=create', {
      labels: { fr: humanName() },
      claims: {
        'wdt:P31': [ 'wd:Q571' ],
         // invalid property: wd:P50
        'wd:P50': [ 'wd:Q535' ]
      }
    })
    .catch(function(err){
      err.body.status_verbose.should.equal('invalid property');
      err.statusCode.should.equal(400);
      return done();}).catch(undesiredErr(done));

  });

  it('should reject invalid claim property value', function(done){
    authReq('post', '/api/entities?action=create', {
      labels: { fr: humanName() },
      claims: {
        'wdt:P31': [ 'wd:Q571' ],
        // invalid value: wd####Q535 as entity URI
        'wdt:P50': [ 'wd####Q535' ]
      }
    })
    .catch(function(err){
      err.body.status_verbose.should.equal('invalid property value');
      err.statusCode.should.equal(400);
      return done();}).catch(undesiredErr(done));

  });

  it('should reject an entity created with a concurrent property with a value already taken', function(done){
    ensureEditionExists('isbn:9782315006113', null, {
      claims: {
        'wdt:P31': [ 'wd:Q3331189' ],
        'wdt:P212': [ '978-2-315-00611-3' ],
        'wdt:P1476': [ randomLabel() ]
      }
    })
    .then(editionEntity => authReq('post', '/api/entities?action=create', {
      claims: {
        'wdt:P31': [ 'wd:Q3331189' ],
        'wdt:P212': [ '978-2-315-00611-3' ],
        'wdt:P1476': [ randomLabel() ],
        'wdt:P629': editionEntity.claims['wdt:P629']
      }
    }))
    .catch(function(err){
      err.body.status_verbose.should.equal('this property value is already used');
      err.statusCode.should.equal(400);
      return done();}).catch(undesiredErr(done));

  });

  it('should reject creation with incorrect properties such as pages counts for works', function(done){
    authReq('post', '/api/entities?action=create', {
      labels: { fr: randomLabel() },
      claims: {
        'wdt:P31': [ 'wd:Q571' ],
        'wdt:P1104': [ 124 ]
      }
    })
    .then(undesiredRes(done))
    .catch(function(err){
      err.body.status_verbose.should.equal("works can't have a property wdt:P1104");
      err.statusCode.should.equal(400);
      return done();}).catch(undesiredErr(done));

  });

  return it('should reject invalid prefixes', function(done){
    authReq('post', '/api/entities?action=create', {
      prefix: 'foo',
      labels: {},
      claims: {}
    })
    .then(undesiredRes(done))
    .catch(function(err){
      err.body.status_verbose.should.startWith('invalid prefix: foo');
      err.statusCode.should.equal(400);
      return done();}).catch(undesiredErr(done));

  });
});

  // See also: edititons/create.test.coffee
