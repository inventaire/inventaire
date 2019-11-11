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
const { undesiredErr, undesiredRes } = require('../utils/utils');
const randomString = __.require('lib', './utils/random_string');
const { getByUris, merge, getHistory, addClaim } = require('../utils/entities');
const { getByIds: getItemsByIds } = require('../utils/items');
const { createWork, createHuman, createEdition, ensureEditionExists, createItemFromEntityUri, createWorkWithAuthor } = require('../fixtures/entities');

describe('entities:merge', function() {
  it('should merge two entities with an inv URI', function(done){
    Promise.all([
      createWork(),
      createWork()
    ])
    .spread((workA, workB) => merge(workA.uri, workB.uri)
    .then(() => getByUris(workA.uri))
    .then(function(res){
      res.redirects[workA.uri].should.equal(workB.uri);
      res.entities[workB.uri].should.be.ok();
      return done();
    })).catch(undesiredErr(done));

  });

  it('should merge entities with inv and isbn URIs', function(done){
    Promise.all([
      createEdition(),
      ensureEditionExists('isbn:9782298063264')
    ])
    .spread((editionA, editionB) => createItemFromEntityUri(editionA.uri)
    .then(function(item){
      item.entity.should.equal(editionA.uri);
      return merge(editionA.uri, editionB.uri)
      .then(() => Promise.all([
        getByUris(editionA.uri),
        getItemsByIds(item._id)
      ]))
      .spread(function(entitiesRes, itemsRes){
        entitiesRes.redirects[editionA.uri].should.equal(editionB.uri);
        entitiesRes.entities[editionB.uri].should.be.ok();
        itemsRes.items[0].entity.should.equal(editionB.uri);
        return done();
      });
    })).catch(undesiredErr(done));

  });

  it('should merge an entity with an ISBN', function(done){
    Promise.all([
      ensureEditionExists('isbn:9782298063264'),
      createEdition()
    ])
    .spread((editionA, editionB) => createItemFromEntityUri(editionB.uri)
    .then(item => merge(editionA.uri, editionB.uri)
    .then(() => Promise.all([
      getByUris(editionB.uri),
      getItemsByIds(item._id)
    ]))
    .spread(function(entitiesRes, itemsRes){
      const { entities, redirects } = entitiesRes;
      const updatedEditionB = entities[redirects[editionB.uri]];
      updatedEditionB.claims['wdt:P212']
      .should.deepEqual(editionA.claims['wdt:P212']);
      const isbnUri = editionA.uri;
      itemsRes.items[0].entity.should.equal(isbnUri);
      return done();
    }))).catch(undesiredErr(done));

  });

  it('should reject merge with different ISBNs', function(done){
    Promise.all([
      ensureEditionExists('isbn:9782298063264'),
      ensureEditionExists('isbn:9782211225915')
    ])
    .spread((editionA, editionB) => merge('isbn:9782298063264', 'isbn:9782211225915')
    .then(undesiredRes(done))
    .catch(function(err){
      // That's not a very specific error report, but it does the job
      // of blocking a merge from an edition with an ISBN
      err.body.status_verbose
      .should.equal("can't merge editions with different ISBNs");
      err.statusCode.should.equal(400);
      return done();
    })).catch(undesiredErr(done));

  });

  it('should transfer claims', function(done){
    Promise.all([
      createWork(),
      createWork()
    ])
    .spread((workA, workB) => addClaim(workA.uri, 'wdt:P50', 'wd:Q535')
    .then(() => merge(workA.uri, workB.uri))
    .then(() => getByUris(workB.uri))
    .then(function(res){
      const authorsUris = res.entities[workB.uri].claims['wdt:P50'];
      authorsUris.should.deepEqual([ 'wd:Q535' ]);
      return done();
    })).catch(undesiredErr(done));

  });

  it('should transfer labels', function(done){
    const label = randomString(6);
    Promise.all([
      createWork({ labels: { zh: label } }),
      createWork()
    ])
    .spread((workA, workB) => merge(workA.uri, workB.uri)
    .then(() => getByUris(workB.uri))
    .then(function(res){
      res.entities[workB.uri].labels.zh.should.equal(label);
      return done();
    })).catch(undesiredErr(done));

  });

  it('should keep track of the patch context', function(done){
    Promise.all([
      createWork(),
      createWork()
    ])
    .spread((workA, workB) => addClaim(workA.uri, 'wdt:P50', 'wd:Q535')
    .then(() => merge(workA.uri, workB.uri))
    .then(() => getHistory(workB._id))
    .then(function(patches){
      patches[1].context.mergeFrom.should.equal(workA.uri);
      return done();
    })).catch(undesiredErr(done));

  });

  it('should redirect claims', function(done){
    Promise.all([
      createHuman(),
      createHuman(),
      createWork()
    ])
    .spread((humanA, humanB, work) => addClaim(work.uri, 'wdt:P50', humanA.uri)
    .then(() => merge(humanA.uri, humanB.uri))
    .then(() => getByUris(work.uri))
    .then(function(res){
      const authorsUris = res.entities[work.uri].claims['wdt:P50'];
      return authorsUris.should.deepEqual([ humanB.uri ]);})
    .then(() => getHistory(work._id))
    .then(function(patches){
      // patch 0: create the work entity
      // patch 1: add a wdt:P50 claim pointing to to humanA
      // patch 2: redirect to humanB
      patches[2].context.redirectClaims
      .should.deepEqual({ fromUri: humanA.uri });
      return done();
    })).catch(undesiredErr(done));

  });

  it('should reject a merge from a redirection', function(done){
    Promise.all([
      createWork(),
      createWork(),
      createWork()
    ])
    .spread((workA, workB, workC) => merge(workA.uri, workB.uri)
    .then(() => merge(workA.uri, workC.uri))
    .then(undesiredRes(done))
    .catch(function(err){
      err.statusCode.should.equal(400);
      err.body.status_verbose.should.equal("'from' entity is already a redirection");
      return done();
    })).catch(undesiredErr(done));

  });

  it('should reject a merge to a redirection', function(done){
    Promise.all([
      createWork(),
      createWork(),
      createWork()
    ])
    .spread((workA, workB, workC) => merge(workA.uri, workB.uri)
    .then(() => merge(workC.uri, workA.uri))
    .then(undesiredRes(done))
    .catch(function(err){
      err.statusCode.should.equal(400);
      err.body.status_verbose.should.equal("'to' entity is already a redirection");
      return done();
    })).catch(undesiredErr(done));

  });

  it('should reject a circular merge', function(done){
    createWork()
    .then(work => merge(work.uri, work.uri)
    .then(undesiredRes(done))
    .catch(function(err){
      err.statusCode.should.equal(400);
      err.body.status_verbose
      .should.equal("can't merge an entity into itself");
      return done();
    })).catch(undesiredErr(done));

  });

  return it('should remove isolated human "placeholders" entities on works merge', function(done) {
    Promise.all([
      createWorkWithAuthor(),
      createWorkWithAuthor()
    ])
    .spread(function(workA, workB){
      const humanAUri = workA.claims['wdt:P50'][0];
      return merge(workA.uri, workB.uri)
      .then(() => getByUris(humanAUri))
      .then(function(res){
        const entity = res.entities[humanAUri];
        entity._meta_type.should.equal('removed:placeholder');
        return done();
      });}).catch(done);

  });
});
