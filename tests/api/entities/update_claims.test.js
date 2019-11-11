/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const CONFIG = require('config');
const __ = CONFIG.universalPath;
const _ = __.require('builders', 'utils');
const should = require('should');
const { Promise } = __.require('lib', 'promises');
const { undesiredRes, undesiredErr } = require('../utils/utils');
const { createWork, createEdition, createHuman, someOpenLibraryId } = require('../fixtures/entities');
const { getByUri, addClaim, updateClaim, removeClaim, merge } = require('../utils/entities');

describe('entities:update-claims', function() {
  it('should reject an update with an inappropriate property', function(done){
    createWork()
    .then(work => // A work entity should not have pages count
    addClaim(work.uri, 'wdt:P1104', 124)
    .then(undesiredRes(done))
    .catch(function(err){
      err.body.status_verbose.should.equal("works can't have a property wdt:P1104");
      err.statusCode.should.equal(400);
      return done();
    })).catch(undesiredErr(done));

  });

  it('should reject an update with an inappropriate property datatype', function(done){
    createWork()
    .then(work => addClaim(work.uri, 'wdt:P50', 124)
    .then(undesiredRes(done))
    .catch(function(err){
      err.body.status_verbose.should.equal('invalid value type: expected string, got number');
      err.statusCode.should.equal(400);
      return done();
    })).catch(undesiredErr(done));

  });

  it('should reject an update with an invalid property value', function(done){
    createEdition()
    .then(edition => addClaim(edition.uri, 'wdt:P123', 'not an entity uri')
    .then(undesiredRes(done))
    .catch(function(err){
      err.body.status_verbose.should.equal('invalid property value');
      err.statusCode.should.equal(400);
      return done();
    })).catch(undesiredErr(done));

  });

  it('should reject an update removing a critical claim', function(done){
    createEdition()
    .then(function(edition){
      const oldValue = edition.claims['wdt:P629'][0];
      // An edition entity should always have at least one wdt:P629 claim
      return removeClaim(edition.uri, 'wdt:P629', oldValue)
      .then(undesiredRes(done))
      .catch(function(err){
        err.body.status_verbose.should.equal('this property should at least have one value');
        err.statusCode.should.equal(400);
        return done();
      });}).catch(undesiredErr(done));

  });

  it('should reject an update on an unexisting claim (property with no claim)', function(done){
    createEdition()
    .then(edition => updateClaim(edition.uri, 'wdt:P655', 'wd:Q23', 'wd:Q42'))
    .then(undesiredRes(done))
    .catch(function(err){
      err.statusCode.should.equal(400);
      err.body.status_verbose.should.equal('claim property value not found');
      return done();}).catch(undesiredErr(done));

  });

  it('should reject an update on an unexisting claim (property with claims)', function(done){
    createEdition()
    .tap(edition => addClaim(edition.uri, 'wdt:P655', 'wd:Q535'))
    .then(edition => updateClaim(edition.uri, 'wdt:P655', 'wd:Q23', 'wd:Q42'))
    .then(undesiredRes(done))
    .catch(function(err){
      err.statusCode.should.equal(400);
      err.body.status_verbose.should.equal('claim property value not found');
      return done();}).catch(undesiredErr(done));

  });

  it('should reject an update on an obsolete entity', function(done){
    Promise.all([
      createWork(),
      createWork()
    ])
    .spread((workA, workB) => merge(workA.uri, workB.uri)
    .then(() => addClaim(workA.uri, 'wdt:P50', 'wd:Q535'))).then(undesiredRes(done))
    .catch(function(err){
      err.statusCode.should.equal(400);
      err.body.status_verbose.should.equal('this entity is obsolete');
      return done();}).catch(undesiredErr(done));

  });

  it('should accept rapid updates on the same entity', function(done){
    const authorsUris = [ 'wd:Q192214', 'wd:Q206685' ];
    createWork()
    .then(function(work){
      const { uri: workUri } = work;
      return Promise.all(authorsUris.map(uri => addClaim(work.uri, 'wdt:P50', uri)))
      .then(function(responses){
        responses.forEach(res => should(res.ok).be.true());
        return getByUri(work.uri)
        .then(function(updatedWork){
          const addedAuthorsUris = updatedWork.claims['wdt:P50'];
          authorsUris.forEach(uri => should(addedAuthorsUris.includes(uri)).be.true());
          return done();
        });
      });}).catch(undesiredErr(done));

  });

  it('should accept a non-duplicated concurrent value', function(done){
    createHuman()
    .then(human => addClaim(human._id, 'wdt:P648', someOpenLibraryId())
    .then(function(res){
      should(res.ok).be.true();
      return done();
    })).catch(undesiredErr(done));

  });

  it('should reject invalid value for type-specific value formats', function(done){
    createHuman()
    .then(human => updateClaim(human.uri, 'wdt:P648', null, someOpenLibraryId('work'))
    .then(undesiredRes(done))
    .catch(function(err){
      err.statusCode.should.equal(400);
      err.body.status_verbose.should.equal('invalid property value for entity type human');
      return done();
    })).catch(undesiredErr(done));

  });

  return it('should reject an update with a duplicated concurrent value', function(done){
    const id = someOpenLibraryId();
    createHuman()
    .then(human => addClaim(human.uri, 'wdt:P648', id)
    .then(function(res){
      should(res.ok).be.true();
      return createHuman();
    })).then(human2 => addClaim(human2.uri, 'wdt:P648', id)
    .then(undesiredRes(done))
    .catch(function(err){
      err.statusCode.should.equal(400);
      err.body.status_verbose.should.equal('this property value is already used');
      return done();
    })).catch(undesiredErr(done));

  });
});
