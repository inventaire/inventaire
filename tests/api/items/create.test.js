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
const { authReq, getUser, undesiredErr, undesiredRes } = require('../utils/utils');
const { ensureEditionExists, createEdition, createWorkWithAuthor, createHuman } = require('../fixtures/entities');
const { createItem } = require('../fixtures/items');
const { createUser, getRefreshedUser } = require('../fixtures/users');
const { getByUris: getEntitiesByUris } = require('../utils/entities');
const debounceDelay = CONFIG.itemsCountDebounceTime + 100;

const editionUriPromise = createEdition().get('uri');

describe('items:create', function() {
  it('should create an item', function(done){
    Promise.all([
      getUser(),
      editionUriPromise
    ])
    .spread(function(user, editionUri){
      const userId = user._id;
      return authReq('post', '/api/items', { entity: editionUri })
      .then(function(item){
        item.entity.should.equal(editionUri);
        item.listing.should.equal('private');
        item.transaction.should.equal('inventorying');
        return item.owner.should.equal(userId);}).delay(10)
      .then(() => done());}).catch(undesiredErr(done));

  });

  it('should create items in bulk', function(done){
    Promise.all([
      getUser(),
      editionUriPromise
    ])
    .spread(function(user, editionUri){
      const userId = user._id;
      return authReq('post', '/api/items', [
        { entity: editionUri, listing: 'network', transaction: 'giving' },
        { entity: editionUri, listing: 'public', transaction: 'lending' }
      ])
      .then(function(items){
        items[0].entity.should.equal(editionUri);
        items[0].listing.should.equal('network');
        items[0].transaction.should.equal('giving');
        items[0].owner.should.equal(userId);
        items[1].entity.should.equal(editionUri);
        items[1].listing.should.equal('public');
        items[1].transaction.should.equal('lending');
        return items[1].owner.should.equal(userId);}).delay(10)
      .then(() => done());}).catch(undesiredErr(done));

  });

  it('should increment the user items counter', function(done){
    const userPromise = createUser();
    const timestamp = Date.now();
    createItem(userPromise, { listing: 'public' })
    .delay(debounceDelay)
    .then(() => getRefreshedUser(userPromise))
    .then(function(user){
      user.snapshot.public['items:count'].should.equal(1);
      user.snapshot.public['items:last-add'].should.be.greaterThan(timestamp);
      user.snapshot.network['items:count'].should.equal(0);
      user.snapshot.private['items:count'].should.equal(0);
      return done();}).catch(undesiredErr(done));

  });

  it('should deduce the title from an edition entity', function(done){
    const title = 'Un mariage à Lyon';
    ensureEditionExists('isbn:9782253138938', null, {
      labels: {},
      claims: {
        'wdt:P31': [ 'wd:Q3331189' ],
        'wdt:P212': [ '978-2-253-13893-8' ],
        'wdt:P1476': [ title ]
      }
    })
    .then(() => authReq('post', '/api/items', { entity: 'isbn:9782253138938' })
    .then(function(item){
      item.snapshot.should.be.an.Object();
      item.snapshot['entity:title'].should.equal(title);
      return done();
    })).catch(undesiredErr(done));

  });

  it('should deduce the author from a work entity', function(done){
    createHuman()
    .then(author => createWorkWithAuthor(author)
    .then(workEntity => authReq('post', '/api/items', { entity: workEntity.uri, lang: 'en' })
    .then(function(item){
      item.snapshot.should.be.an.Object();
      item.snapshot['entity:authors'].should.equal(author.labels.en);
      return done();
    }))).catch(undesiredErr(done));

  });

  it('should deduce the author from an edition entity', function(done){
    ensureEditionExists('isbn:9780812993257', null, {
      labels: {},
      claims: {
        'wdt:P31': [ 'wd:Q3331189' ],
        'wdt:P212': [ '978-0-8129-9325-7' ],
        'wdt:P1476': [ 'The Road to Character' ]
      }
    })
    .then(edition => Promise.all([
      getEntitiesByUris(edition.uri, 'wdt:P629|wdt:P50').get('entities'),
      authReq('post', '/api/items', { entity: 'isbn:9780812993257' })
    ])
    .spread(function(entities, item){
      edition = entities[edition.uri];
      const work = entities[edition.claims['wdt:P629'][0]];
      const author = entities[work.claims['wdt:P50'][0]];
      const authorLabel = _.values(author.labels)[0];
      item.snapshot.should.be.an.Object();
      item.snapshot['entity:authors'].should.equal(authorLabel);
      return done();
    })).catch(undesiredErr(done));

  });

  it('should reject an item created with an unknown entity', function(done){
    authReq('post', '/api/items', { entity: 'isbn:9782290711217', lang: 'fr' })
    .catch(function(err){
      err.statusCode.should.equal(400);
      err.body.status_verbose.should.equal('entity not found');
      return done();}).catch(undesiredErr(done));

  });

  it('should reject an item created with a non-whitelisted entity type', function(done){
    authReq('post', '/api/items', { entity: 'wd:Q1', lang: 'fr' })
    .catch(function(err){
      err.statusCode.should.equal(400);
      err.body.status_verbose.should.equal('invalid entity type');
      return done();}).catch(undesiredErr(done));

  });

  it('should use the original language label for an item created from a work without specifying in which lang the title is', function(done){
    authReq('post', '/api/items', { entity: 'wd:Q3548806' })
    .then(function(item){
      item.snapshot.should.be.an.Object();
      item.snapshot['entity:title'].should.equal('Die Hochzeit von Lyon');
      item.snapshot['entity:lang'].should.equal('de');
      return done();}).catch(undesiredErr(done));

  });

  it('should reject an item created with an invalid URI', function(done){
    authReq('post', '/api/items', { entity: 'isbn:9782800051922' })
    .catch(function(err){
      err.statusCode.should.equal(400);
      err.body.status_verbose.should.equal('invalid uri id: 9782800051922 (uri: isbn:9782800051922)');
      return done();}).catch(undesiredErr(done));

  });

  // Should not create edition conflicts on the user document
  return it('should keep the snapshot data updated even when created in bulk', function(done){
    const userPromise = createUser();
    Promise.all([
      createItem(userPromise, { listing: 'public' }),
      createItem(userPromise, { listing: 'network' }),
      createItem(userPromise, { listing: 'private' })
    ])
    .delay(debounceDelay)
    .then(() => getRefreshedUser(userPromise))
    .then(function(user){
      user.snapshot.public['items:count'].should.equal(1);
      user.snapshot.network['items:count'].should.equal(1);
      user.snapshot.private['items:count'].should.equal(1);
      return done();}).catch(undesiredErr(done));

  });
});
