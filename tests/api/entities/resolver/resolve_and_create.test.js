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
const { authReq, adminReq, getUser, undesiredErr, undesiredRes } = __.require('apiTests', 'utils/utils');
const { getByUris, getHistory } = __.require('apiTests', 'utils/entities');
const { randomLabel, humanName, generateIsbn13, someGoodReadsId, ensureEditionExists } = __.require('apiTests', 'fixtures/entities');

const resolveAndCreate = entry => authReq('post', '/api/entities?action=resolve', {
  entries: [ entry ],
  create: true
}
);

describe('entities:resolve:create-unresolved', function() {
  it('should create unresolved edition, work and author (the trinity)', function(done){
    resolveAndCreate({
      edition: { isbn: generateIsbn13() },
      works: [ { labels: { en: randomLabel() } } ],
      authors: [ { labels: { en: humanName() } } ]})
    .get('entries')
    .then(function(entries){
      const result = entries[0];
      result.edition.created.should.be.true();
      result.authors[0].created.should.be.true();
      result.works[0].created.should.be.true();
      should(result.edition.uri).be.ok();
      should(result.works[0].uri).be.ok();
      should(result.authors[0].uri).be.ok();
      return done();}).catch(undesiredErr(done));

  });

  it('should resolve and not create an existing edition', function(done){
    const rawIsbn = generateIsbn13();
    ensureEditionExists(`isbn:${rawIsbn}`)
    .then(() => resolveAndCreate({ edition: { isbn: rawIsbn } }))
    .get('entries')
    .then(function(entries){
      entries[0].should.be.an.Object();
      entries[0].edition.uri.should.equal(`isbn:${rawIsbn}`);
      return done();}).catch(done);

  });

  it('should create edition with title and isbn', function(done){
    const editionLabel = randomLabel();
    resolveAndCreate({
      edition: { isbn: generateIsbn13(), claims: { 'wdt:P1476': editionLabel } },
      works: [ { labels: { en: randomLabel() } } ]})
    .get('entries')
    .then(function(entries){
      const result = entries[0];
      should(result.edition.uri).be.ok();
      const { edition } = result;

      return getByUris(edition.uri)
      .get('entities')
      .then(function(entities){
        const editionClaims = _.values(entities)[0].claims;
        const newEditionTitle = editionClaims['wdt:P1476'][0];

        should(editionClaims['wdt:P212'][0]).be.ok();
        newEditionTitle.should.equal(editionLabel);
        return done();
      });}).catch(undesiredErr(done));

  });

  it('should ignore unresolved work from resolve edition', function(done){
    const isbn = generateIsbn13();
    ensureEditionExists(`isbn:${isbn}`)
    .then(edition => resolveAndCreate({
      edition: { isbn },
      works: [ { labels: { en: randomLabel() } } ]})
    .then(function(res){
      const entry = res.entries[0];
      entry.works[0].resolved.should.be.false();
      entry.works[0].created.should.be.false();
      return done();
    })).catch(done);

  });

  it('should add optional claims to created edition', function(done){
    const frenchLang = 'wd:Q150';
    resolveAndCreate({
      edition: { isbn: generateIsbn13(), claims: { 'wdt:P407': [ frenchLang ] } },
      works: [ { labels: { en: randomLabel() } } ]})
    .get('entries')
    .then(function(entries){
      const result = entries[0];
      should(result.edition.uri).be.ok();
      const { edition } = result;
      return getByUris(edition.uri)
      .get('entities')
      .then(function(entities){
        const newWorkClaimValue = _.values(entities)[0].claims['wdt:P407'][0];
        newWorkClaimValue.should.equal(frenchLang);
        return done();
      });}).catch(undesiredErr(done));

  });

  it('should add optional claims to created works', function(done){
    const goodReadsId = someGoodReadsId();
    resolveAndCreate({
      edition: { isbn: generateIsbn13() },
      works: [ { claims: { 'wdt:P2969': [ goodReadsId ] }, labels: { en: randomLabel() } } ]})
    .get('entries')
    .then(function(entries){
      const result = entries[0];
      should(result.edition.uri).be.ok();
      const { works } = result;
      return getByUris(works.map(_.property('uri')))
      .get('entities')
      .then(function(entities){
        const newWorkClaimValue = _.values(entities)[0].claims['wdt:P2969'][0];
        newWorkClaimValue.should.equal(goodReadsId);
        return done();
      });}).catch(undesiredErr(done));

  });

  it('should add optional claims to created authors', function(done){
    const goodReadsId = someGoodReadsId();
    resolveAndCreate({
      edition: { isbn: generateIsbn13() },
      works: [ { labels: { en: randomLabel() } } ],
      authors: [ { claims: { 'wdt:P2963': [ goodReadsId ] }, labels: { en: humanName() } } ]})
    .get('entries')
    .then(function(entries){
      const result = entries[0];
      should(result.edition.uri).be.ok();
      const { authors } = result;
      return getByUris(authors.map(_.property('uri')))
      .get('entities')
      .then(function(entities){
        const newWorkClaimValue = _.values(entities)[0].claims['wdt:P2963'][0];
        newWorkClaimValue.should.equal(goodReadsId);
        return done();
      });}).catch(undesiredErr(done));

  });

  it('should add a batch timestamp to patches', function(done){
    const startTime = Date.now();
    const entry = {
      edition: { isbn: generateIsbn13() },
      works: [ { claims: { 'wdt:P2969': [ someGoodReadsId() ] }, labels: { en: humanName() } } ]
    };
    resolveAndCreate(entry)
    .get('entries')
    .then(function(entries){
      const result = entries[0];
      const { uri: editionUri } = result.edition;
      return getHistory(editionUri)
      .then(function(patches){
        const patch = patches[0];
        patch.batch.should.be.a.Number();
        patch.batch.should.above(startTime);
        patch.batch.should.below(Date.now());
        return done();
      });}).catch(undesiredErr(done));

  });

  it('should add created authors to created works', function(done){
    resolveAndCreate({
      edition: { isbn: generateIsbn13() },
      works: [ { labels: { en: randomLabel() } } ],
      authors: [ { labels: { en: humanName() } } ]})
    .get('entries')
    .then(function(entries){
      const result = entries[0];
      const workUri = result.works[0].uri;
      return getByUris(workUri)
      .get('entities')
      .then(function(entities){
        const work = entities[workUri];
        const workAuthors = work.claims['wdt:P50'];
        workAuthors.includes(result.authors[0].uri).should.be.true();
        return done();
      });}).catch(undesiredErr(done));

  });

  it('should create a work entity from the edition seed', function(done){
    let title = randomLabel();
    title = randomLabel();
    const dutchLangUri = 'wd:Q7411';
    const dutchLangCode = 'nl';
    resolveAndCreate({
      edition: {
        isbn: generateIsbn13(),
        claims: { 'wdt:P1476': [ title ], 'wdt:P407': [ dutchLangUri ] }
      }})
    .get('entries')
    .then(function(entries){
      const work = entries[0].works[0];
      work.labels[dutchLangCode].should.equal(title);
      return done();}).catch(undesiredErr(done));

  });

  return it('should not create works without labels', function(done){
    const title = randomLabel();
    resolveAndCreate({
      edition: {
        isbn: generateIsbn13(),
        claims: { 'wdt:P1476': [ title ] }
      },
      works: [ {} ]})
    .then(undesiredRes(done))
    .catch(function(err){
      err.body.status_verbose.should.startWith('invalid labels');
      return done();}).catch(done);

  });
});
