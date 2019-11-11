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
const { authReq, undesiredRes, undesiredErr } = require('../utils/utils');
const { getByUris, deleteByUris } = require('../utils/entities');
const { getByIds: getItemsByIds } = require('../utils/items');
const { createHuman, createWork, createWorkWithAuthor, createEdition, ensureEditionExists, generateIsbn13 } = require('../fixtures/entities');

describe('entities:delete:by-uris', function() {
  it('should require admin rights', function(done){
    createHuman()
    .then(entity => authReq('post', '/api/entities?action=delete-by-uris', { uris: [ entity.uri ] }))
    .then(undesiredRes(done))
    .catch(function(err){
      err.statusCode.should.equal(403);
      return done();
    });

  });

  it('should reject non-inv URIs', function(done){
    deleteByUris('wd:Q535')
    .then(undesiredRes(done))
    .catch(function(err){
      err.body.status_verbose.should.equal('invalid uri: wd:Q535');
      err.statusCode.should.equal(400);
      return done();}).catch(undesiredErr(done));

  });

  it('should turn entity into removed:placeholder', function(done){
    createHuman()
    .then(function(entity){
      const { uri } = entity;
      return deleteByUris(uri)
      .then(() => getByUris(uri))
      .then(function(res){
        entity = res.entities[uri];
        entity._meta_type.should.equal('removed:placeholder');
        return done();
      });}).catch(undesiredErr(done));

  });

  it('should remove several entities', function(done){
    Promise.all([
      createHuman(),
      createWork()
    ])
    .spread(function(entityA, entityB){
      const uris = [ entityA.uri, entityB.uri ];
      return deleteByUris(uris)
      .then(() => getByUris(uris))
      .then(function(res){
        for (let entity = 0; entity < res.entities.length; entity++) {
          const uri = res.entities[entity];
          entity._meta_type.should.equal('removed:placeholder');
        }
        return done();
      });}).catch(undesiredErr(done));

  });

  it('should delete the claims where this entity is the value', function(done){
    createWorkWithAuthor()
    .then(function(work){
      const { uri:workUri } = work;
      const authorUri = work.claims['wdt:P50'][0];
      return deleteByUris(authorUri)
      .then(() => getByUris(workUri))
      .then(function(res){
        const updatedWork = res.entities[workUri];
        should(updatedWork.claims['wdt:P50']).not.be.ok();
        return done();
      });}).catch(undesiredErr(done));

  });

  // Entities with more than one claim should be turned into redirections
  it('should refuse to delete entities that are values in more than one claim', function(done){
    createHuman()
    .then(author => Promise.all([ createWorkWithAuthor(author), createWorkWithAuthor(author) ]))
    .spread(function(workA, workB){
      const { uri:workUri } = workA;
      const authorUri = workA.claims['wdt:P50'][0];
      return deleteByUris(authorUri);}).then(undesiredRes(done))
    .catch(function(err){
      err.body.status_verbose.should.equal('this entity has too many claims to be removed');
      err.statusCode.should.equal(400);
      return done();}).catch(undesiredErr(done));
  });

  it('should remove edition entities without an ISBN', function(done){
    createEdition()
    .then(function(edition){
      const invUri = 'inv:' + edition._id;
      return deleteByUris(invUri);}).then(() => done())
    .catch(undesiredErr(done));
  });

  it('should remove edition entities with an ISBN', function(done){
    ensureEditionExists(`isbn:${generateIsbn13()}`)
    .then(function(edition){
      // Using the inv URI, as the isbn one would be rejected
      const invUri = 'inv:' + edition._id;
      return deleteByUris(invUri);}).then(() => done())
    .catch(undesiredErr(done));
  });

  it('should refuse to delete a work that is depend on by an edition', function(done){
    createEdition()
    .then(function(edition){
      const workUri = edition.claims['wdt:P629'][0];
      return deleteByUris(workUri);}).then(undesiredRes(done))
    .catch(function(err){
      err.body.status_verbose.should.equal('this entity is used in a critical claim');
      err.statusCode.should.equal(400);
      return done();}).catch(undesiredErr(done));
  });

  it('should remove deleted entities from items snapshot', function(done){
    createHuman()
    .then(author => createWorkWithAuthor(author)
    .then(work => authReq('post', '/api/items', { entity: work.uri, lang: 'en' })
    .then(function(item){
      item.snapshot['entity:title'].should.equal(work.labels.en);
      item.snapshot['entity:authors'].should.equal(author.labels.en);
      return deleteByUris(author.uri)
      .delay(100)
      .then(() => getItemsByIds(item._id))
      .then(function(res){
        const updatedItem = res.items[0];
        updatedItem.snapshot['entity:title'].should.equal(work.labels.en);
        should(updatedItem.snapshot['entity:authors']).not.be.ok();
        return done();
      });
    }))).catch(undesiredErr(done));

  });

  it('should ignore entities that where already turned into removed:placeholder', function(done){
    createHuman()
    .then(function(entity){
      const { uri } = entity;
      return deleteByUris(uri)
      .then(() => getByUris(uri))
      .then(function(res){
        should(res.entities[uri]._meta_type).equal('removed:placeholder');
        return deleteByUris(uri)
        .then(() => done());
      });}).catch(undesiredErr(done));

  });

  it('should not deleted entities that are the entity of an item', function(done){
    createWork()
    .then(work => authReq('post', '/api/items', { entity: work.uri, lang: 'en' })
    .then(() => deleteByUris(work.uri))
    .then(undesiredRes(done))
    .catch(function(err){
      err.body.status_verbose.should.equal("entities that are used by an item can't be removed");
      err.statusCode.should.equal(400);
      return done();
    })).catch(undesiredErr(done));
  });

  return it('should not remove editions with an ISBN and an item', function(done){
    const uri = 'isbn:9791020906427';
    ensureEditionExists(uri)
    .then(edition => authReq('post', '/api/items', { entity: uri, lang: 'en' })
    .then(function() {
      // Using the inv URI, as the isbn one would be rejected
      const invUri = 'inv:' + edition._id;
      return deleteByUris(invUri);
    })).then(undesiredRes(done))
    .catch(function(err){
      err.body.status_verbose.should.equal("entities that are used by an item can't be removed");
      err.statusCode.should.equal(400);
      return done();}).catch(undesiredErr(done));
  });
});
