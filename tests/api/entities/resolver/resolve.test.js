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
const { authReq, undesiredRes, undesiredErr } = __.require('apiTests', 'utils/utils');
const elasticsearchUpdateDelay = CONFIG.entitiesSearchEngine.elasticsearchUpdateDelay || 1000;
const { createWork, createEdition, createHuman, someGoodReadsId, someOpenLibraryId, createWorkWithAuthor, generateIsbn13 } = __.require('apiTests', 'fixtures/entities');
const { addClaim, getByUri } = __.require('apiTests', 'utils/entities');
const { ensureEditionExists, randomLabel, humanName } = __.require('apiTests', 'fixtures/entities');
const { toIsbn13h } = __.require('lib', 'isbn/isbn');

const resolve = function(entries){
  entries = _.forceArray(entries);
  return authReq('post', '/api/entities?action=resolve', { entries });
};

describe('entities:resolve', function() {
  it('should throw when invalid isbn is passed', function(done){
    const invalidIsbn = '9780000000000';
    resolve({ edition: { isbn: invalidIsbn } })
    .catch(function(err){
      err.statusCode.should.equal(400);
      err.body.status_verbose.should.startWith('invalid isbn');
      return done();}).catch(undesiredErr(done));

  });

  it('should resolve an edition entry from an ISBN', function(done){
    const isbn13 = generateIsbn13();
    const editionSeed = { isbn: isbn13 };
    const entry = { edition: editionSeed };
    ensureEditionExists(`isbn:${isbn13}`)
    .then(() => resolve(entry))
    .get('entries')
    .then(function(entries){
      entries[0].should.be.an.Object();
      entries[0].edition.uri.should.equal(`isbn:${isbn13}`);
      return done();}).catch(done);

  });

  it('should resolve an edition from a known edition external id', function(done){
    const openLibraryId = someOpenLibraryId('edition');
    const isbn13 = generateIsbn13();
    ensureEditionExists(`isbn:${isbn13}`)
    .tap(edition => addClaim(`inv:${edition._id}`, 'wdt:P648', openLibraryId))
    .then(function(edition){
      const editionSeed = { claims: { 'wdt:P648': [ openLibraryId ] } };
      const entry = { edition: editionSeed };
      return resolve(entry)
      .get('entries')
      .then(function(entries){
        entries[0].edition.uri.should.equal(edition.uri);
        return done();
      });}).catch(done);

  });

  it('should resolve an edition entry from an ISBN set in the claims', function(done){
    const isbn13 = generateIsbn13();
    const isbn13h = toIsbn13h(isbn13);
    const editionSeed = { claims: { 'wdt:P212': isbn13h } };
    const entry = { edition: editionSeed };
    ensureEditionExists(`isbn:${isbn13}`)
    .then(() => resolve(entry))
    .get('entries')
    .then(function(entries){
      entries[0].should.be.an.Object();
      entries[0].edition.uri.should.equal(`isbn:${isbn13}`);
      return done();}).catch(done);

  });

  it('should resolve multiple entries', function(done){
    const isbn13A = generateIsbn13();
    const isbn13B = generateIsbn13();
    const entryA = { edition: { isbn: isbn13A } };
    const entryB = { edition: { isbn: isbn13B } };
    Promise.all([
      ensureEditionExists(`isbn:${isbn13A}`),
      ensureEditionExists(`isbn:${isbn13B}`)
    ])
    .then(() => resolve([ entryA, entryB ]))
    .get('entries')
    .then(function(entries){
      entries[0].should.be.an.Object();
      entries[0].edition.uri.should.equal(`isbn:${isbn13A}`);
      entries[1].should.be.an.Object();
      entries[1].edition.uri.should.equal(`isbn:${isbn13B}`);
      return done();}).catch(done);

  });

  it('should reject if key "edition" is missing', function(done){
    resolve({})
    .then(undesiredRes(done))
    .catch(function(err){
      err.statusCode.should.equal(400);
      err.body.status_verbose.should.startWith('missing edition in entry');
      return done();}).catch(done);

  });

  it('should reject when no isbn is found', function(done){
    const entry = {
      edition: [ { claims: { 'wdt:P1476': randomLabel() } } ],
      works: [ { labels: { en: randomLabel() } } ]
    };
    resolve(entry)
    .catch(function(err){
      err.statusCode.should.equal(400);
      err.body.status_verbose.should.startWith('no isbn or external id claims found');
      return done();}).catch(done);

  });

  it('should reject when label lang is invalid', function(done){
    resolve({
      edition: { isbn: generateIsbn13() },
      works: [ { labels: { notalang: 'foo' } } ]})
    .then(undesiredRes(done))
    .catch(function(err){
      err.statusCode.should.equal(400);
      err.body.status_verbose.should.equal('invalid label lang');
      return done();}).catch(done);

  });

  it('should reject when label value is invalid', function(done){
    resolve({
      edition: { isbn: generateIsbn13() },
      works: [ { labels: { fr: [ 'foo' ] } } ]})
    .then(undesiredRes(done))
    .catch(function(err){
      err.statusCode.should.equal(400);
      err.body.status_verbose.should.equal('invalid label');
      return done();}).catch(done);

  });

  it('should reject when claims key is not an array of objects', function(done){
    resolve({
      edition: { isbn: generateIsbn13() },
      works: [ { claims: [ 'wdt:P31: wd:Q23' ] } ]})
    .then(undesiredRes(done))
    .catch(function(err){
      err.statusCode.should.equal(400);
      err.body.status_verbose.should.startWith('invalid claims');
      return done();}).catch(done);

  });

  it('should reject when claims value is invalid', function(done){
    resolve({
      edition: { isbn: generateIsbn13() },
      works: [ { claims: { 'wdt:P50': [ 'not a valid entity uri' ] } } ]})
    .then(undesiredRes(done))
    .catch(function(err){
      err.statusCode.should.equal(400);
      err.body.status_verbose.should.equal('invalid property value');
      return done();}).catch(done);

  });

  return it('should reject when claims key has an unknown property', function(done){
    const unknownProp = 'wdt:P6';
    const seed = {
      isbn: generateIsbn13(),
      claims: { [unknownProp]: [ 'wd:Q23' ] }
    };
    resolve({ edition: seed })
    .then(undesiredRes(done))
    .catch(function(err){
      err.statusCode.should.equal(400);
      err.body.status_verbose.should.equal("property isn't whitelisted");
      return done();}).catch(done);

  });
});

describe('entities:resolve:external-id', function() {
  it('should resolve wikidata work from external ids claim', function(done){
    resolve({
      edition: { isbn: generateIsbn13() },
      works: [{
        claims: {
          'wdt:P1085': [ '28158' ]
        }
      }
      ]})
    .get('entries')
    .then(function(entries){
      entries[0].works.should.be.an.Array();
      entries[0].works[0].should.be.an.Object();
      entries[0].works[0].uri.should.equal('wd:Q151883');
      return done();}).catch(done);

  });

  it('should resolve inventaire work from external ids claim', function(done){
    const goodReadsId = someGoodReadsId();
    createWork()
    .tap(work => addClaim(work.uri, 'wdt:P2969', goodReadsId))
    .delay(10)
    .then(work => resolve({
      edition: { isbn: generateIsbn13() },
      works: [ { claims: { 'wdt:P2969': [ goodReadsId ] } } ]})
    .get('entries')
    .then(function(entries){
      entries[0].works.should.be.an.Array();
      entries[0].works[0].should.be.an.Object();
      entries[0].works[0].uri.should.equal(work.uri);
      return done();
    })).catch(done);

  });

  it('should resolve wikidata author from external ids claim', function(done){
    resolve({
      edition: { isbn: generateIsbn13() },
      authors: [{
        claims: {
          'wdt:P648': [ 'OL28127A' ]
        }
      }
      ]})
    .get('entries')
    .then(function(entries){
      entries[0].authors.should.be.an.Array();
      entries[0].authors[0].should.be.an.Object();
      entries[0].authors[0].uri.should.equal('wd:Q16867');
      return done();}).catch(done);

  });

  return it('should resolve inventaire author from external ids claim', function(done){
    const goodReadsId = someGoodReadsId();
    createHuman()
    .delay(10)
    .tap(author => addClaim(author.uri, 'wdt:P2963', goodReadsId))
    .delay(10)
    .then(author => resolve({
      edition: { isbn: generateIsbn13() },
      authors: [ { claims: { 'wdt:P2963': [ goodReadsId ] } } ]})
    .get('entries')
    .then(function(entries){
      entries[0].authors.should.be.an.Array();
      entries[0].authors[0].should.be.an.Object();
      entries[0].authors[0].uri.should.equal(author.uri);
      return done();
    })).catch(done);

  });
});

describe('entities:resolve:in-context', function() {
  it('should resolve work from work label and author with external ids claim', function(done){
    const goodReadsId = someGoodReadsId();
    const missingWorkLabel = randomLabel();
    const otherWorkLabel = randomLabel();
    createHuman()
    .delay(10)
    .tap(author => addClaim(author.uri, 'wdt:P2963', goodReadsId))
    .delay(10)
    .then(author => Promise.all([
      createWorkWithAuthor(author, missingWorkLabel),
      createWorkWithAuthor(author, otherWorkLabel)
    ])
    .spread((work, otherWork) => resolve({
      edition: { isbn: generateIsbn13() },
      works: [ { labels: { en: missingWorkLabel } } ],
      authors: [ { claims: { 'wdt:P2963': [ goodReadsId ] } } ]})
    .get('entries')
    .then(function(entries){
      should(entries[0].works[0].uri).be.ok();
      return done();
    }))).catch(done);

  });

  it('should resolve work from author found in work author claims', function(done){
    createWorkWithAuthor()
    .then(function(work){
      const { labels, claims } = work;
      return resolve({
        edition: { isbn: generateIsbn13() },
        works: [ { labels, claims } ]})
      .get('entries')
      .then(function(entries){
        should(entries[0].works[0].uri).be.ok();
        return done();
      });}).catch(done);

  });

  it('should not resolve work from resolved author when author have several works with same labels', function(done){
    const goodReadsId = someGoodReadsId();
    const workLabel = randomLabel();
    createHuman()
    .delay(10)
    .tap(author => addClaim(author.uri, 'wdt:P2963', goodReadsId))
    .delay(10)
    .then(author => Promise.all([
      createWorkWithAuthor(author, workLabel),
      createWorkWithAuthor(author, workLabel)
    ])
    .spread(function(work, otherWork){
      const entry = {
        edition: { isbn: generateIsbn13() },
        works: [ { labels: { en: workLabel } } ],
        authors: [ { claims: { 'wdt:P2963': [ goodReadsId ] } } ]
      };
      return resolve(entry)
      .get('entries')
      .then(function(entries){
        should(entries[0].works[0].uri).not.be.ok();
        return done();
      });
    })).catch(done);

  });

  it('should resolve author from inv author with same label, and an inv work with external id', function(done){
    const goodReadsId = someGoodReadsId();
    const workLabel = randomLabel();
    createHuman()
    .delay(10)
    .then(author => createWorkWithAuthor(author, workLabel)
    .tap(work => addClaim(work.uri, 'wdt:P2969', goodReadsId))
    .then(function(work){
      const entry = {
        edition: { isbn: generateIsbn13() },
        works: [ { claims: { 'wdt:P2969': [ goodReadsId ] } } ],
        authors: [ { labels: author.labels } ]
      };
      return resolve(entry)
      .get('entries')
      .then(function(entries){
        should(entries[0].works[0].uri).be.ok();
        should(entries[0].authors[0].uri).be.ok();
        return done();
      });
    })).catch(done);

  });

  it('should resolve work from resolve edition', function(done){
    const isbn = generateIsbn13();
    ensureEditionExists(`isbn:${isbn}`)
    .then(edition => getByUri(edition.claims['wdt:P629'][0])
    .then(function(work){
      const { labels } = work;
      return resolve({
        edition: { isbn },
        works: [ { labels } ]})
      .then(function(res){
        res.entries[0].works[0].uri.should.equal(work.uri);
        return done();
      });
    })).catch(done);

  });

  return it('should ignore unresolved work from resolve edition', function(done){
    const isbn = generateIsbn13();
    ensureEditionExists(`isbn:${isbn}`)
    .then(edition => resolve({
      edition: { isbn },
      works: [ { labels: { en: randomLabel() } } ]})
    .then(function(res){
      const entry = res.entries[0];
      entry.works[0].resolved.should.be.false();
      return done();
    })).catch(done);

  });
});

describe('entities:resolve:on-labels', function() {
  it('should not resolve work pair if no labels match', function(done){
    createHuman()
    .then(function(author){
      const workLabel = randomLabel();
      const seedLabel = randomLabel();
      const authorLabel = author.labels.en;
      return createWorkWithAuthor(author, workLabel)
      .delay(elasticsearchUpdateDelay)
      .then(work => resolve(basicEntry(seedLabel, authorLabel))
      .get('entries')
      .then(function(entries){
        should(entries[0].works[0].uri).not.be.ok();
        return done();
      }));}).catch(done);

  });

  it('should resolve author and work pair by searching for exact labels', function(done){
    createHuman()
    .then(function(author){
      const workLabel = randomLabel();
      const authorLabel = author.labels.en;
      return createWorkWithAuthor(author, workLabel)
      .delay(elasticsearchUpdateDelay)
      .then(work => resolve(basicEntry(workLabel, authorLabel))
      .get('entries')
      .then(function(entries){
        entries[0].works[0].uri.should.equal(work.uri);
        entries[0].authors[0].uri.should.equal(author.uri);
        return done();
      }));}).catch(done);

  });

  it('should resolve work pair with case insentive labels', function(done){
    createHuman()
    .then(function(author){
      const workLabel = randomLabel();
      const seedLabel = workLabel.toUpperCase();
      const authorLabel = author.labels.en;
      return createWorkWithAuthor(author, workLabel)
      .delay(elasticsearchUpdateDelay)
      .then(work => resolve(basicEntry(seedLabel, authorLabel))
      .get('entries')
      .then(function(entries){
        entries[0].works[0].uri.should.equal(work.uri);
        entries[0].authors[0].uri.should.equal(author.uri);
        return done();
      }));}).catch(done);

  });

  return it('should not resolve when several works exist', function(done){
    createHuman()
    .then(author => createHuman({ labels: author.labels })
    .then(function(sameLabelAuthor){
      const workLabel = randomLabel();
      return Promise.all([
        createWorkWithAuthor(author, workLabel),
        createWorkWithAuthor(sameLabelAuthor, workLabel)
      ])
      .delay(elasticsearchUpdateDelay)
      .then(works => resolve(basicEntry(workLabel, author.labels.en))
      .get('entries')
      .then(function(entries){
        should(entries[0].works[0].uri).not.be.ok();
        should(entries[0].authors[0].uri).not.be.ok();
        return done();
      }));
    })).catch(done);

  });
});

var basicEntry = (workLabel, authorLabel) => ({
  edition: { isbn: generateIsbn13() },
  works: [ { labels: { en: workLabel } } ],
  authors: [ { labels: { en: authorLabel } } ]
});
