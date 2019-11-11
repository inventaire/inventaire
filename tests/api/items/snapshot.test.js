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
const { authReq, getUserId, undesiredErr } = require('../utils/utils');
const { getById: getItem } = require('../utils/items');
let { getByUri, getByUris, merge, revertMerge, updateLabel, updateClaim } = require('../utils/entities');
const { ensureEditionExists } = require('../fixtures/entities');
const { createWork, createHuman, createSerie, addAuthor, addSerie, createEdition, createEditionFromWorks, createWorkWithAuthor, humanName, someImageHash } = require('../fixtures/entities');
({ updateClaim } = require('../utils/entities'));

describe('items:snapshot', function() {
  it("should snapshot the item's work series names", function(done){
    createWork()
    .then(workEntity => addSerie(workEntity)
    .delay(100)
    .then(serieEntity => authReq('post', '/api/items', { entity: workEntity.uri, lang: 'en' })
    .then(function(item){
      const title = _.values(serieEntity.labels)[0];
      item.snapshot['entity:series'].should.equal(title);
      return done();
    }))).catch(undesiredErr(done));

  });

  it("should snapshot the item's work series ordinal", function(done){
    createWork()
    .then(workEntity => Promise.all([
      authReq('post', '/api/items', { entity: workEntity.uri, lang: 'en' }),
      addSerie(workEntity)
    ])
    .delay(100)
    .spread((item, serieEntity) => updateClaim(workEntity.uri, 'wdt:P1545', null, '5')
    .delay(100)
    .then(() => getItem(item))
    .then(function(item){
      item.snapshot['entity:ordinal'].should.equal('5');
      return updateClaim(workEntity.uri, 'wdt:P1545', '5', '6')
      .delay(100)
      .then(() => getItem(item))
      .then(function(item){
        item.snapshot['entity:ordinal'].should.equal('6');
        return done();
      });
    }))).catch(undesiredErr(done));

  });

  it('should snapshot data from all the works of a composite edition', function(done){
    Promise.all([
      createWork(),
      createWork()
    ])
    .spread((workA, workB) => Promise.all([
      addAuthor(workA),
      addAuthor(workB)
    ])
    .then(authors => Promise.all([
      addSerie(workA),
      addSerie(workB)
    ])
    .then(series => createEditionFromWorks(workA, workB)
    .then(edition => authReq('post', '/api/items', { entity: edition.uri }))
    .then(function(item){
      const authorsNames = authors.map(author => author.labels.en).join(', ');
      const seriesNames = series.map(serie => serie.labels.en).join(', ');
      item.snapshot['entity:authors'].should.equal(authorsNames);
      item.snapshot['entity:series'].should.equal(seriesNames);
      return done();
    })))).catch(undesiredErr(done));

  });

  it('should snapshot the image of an edition', function(done){
    createEdition()
    .then(function(edition){
      edition.image.url.should.equal(`/img/entities/${someImageHash}`);
      return authReq('post', '/api/items', { entity: edition.uri })
      .then(function(item){
        item.snapshot['entity:image'].should.equal(edition.image.url);
        return done();
      });}).catch(done);

  });

  it('should snapshot the subtitle of an edition', function(done){
    createEdition()
    .then(function(edition){
      const subtitle = edition.claims['wdt:P1680'][0];
      subtitle.should.a.String();
      return authReq('post', '/api/items', { entity: edition.uri })
      .then(function(item){
        item.snapshot['entity:subtitle'].should.equal(subtitle);
        return done();
      });}).catch(done);

  });

  it('should snapshot the image of an edition after a work-related refresh', function(done){
    createEdition()
    .then(edition => authReq('post', '/api/items', { entity: edition.uri })
    .then(function(item){
      item.snapshot['entity:image'].should.equal(edition.image.url);
      const workUri = edition.claims['wdt:P629'][0];
      return updateClaim(workUri, 'wdt:P50', null, 'wd:Q535')
      .then(() => getItem(item));}).then(function(item){
      item.snapshot['entity:image'].should.equal(edition.image.url);
      return done();
    })).catch(done);

  });

  return describe('update', function() {
    it('should be updated when its local edition entity title changes', function(done){
      createWork()
      .then(createEditionFromWorks)
      .then(function(res){
        const { _id:entityId, uri } = res;
        return authReq('post', '/api/items', { entity: uri })
        .then(function(item){
          const currentTitle = item.snapshot['entity:title'];
          const updatedTitle = currentTitle.split('$$')[0] + '$$' + new Date().toISOString();

          return updateClaim(entityId, 'wdt:P1476', currentTitle, updatedTitle)
          .delay(100)
          .then(() => getItem(item))
          .then(function(updatedItem){
            updatedItem.snapshot['entity:title'].should.equal(updatedTitle);
            return done();
          });
        });}).catch(undesiredErr(done));

    });

    it('should be updated when its local work entity title changes', function(done){
      createWork()
      .then(function(res){
        const { _id:entityId, uri } = res;
        return authReq('post', '/api/items', { entity: uri, lang: 'en' })
        .then(function(item){
          const currentTitle = item.snapshot['entity:title'];
          const updatedTitle = currentTitle + ' ' + new Date().toISOString();
          return updateLabel(entityId, 'en', updatedTitle)
          .delay(100)
          .then(() => getItem(item))
          .then(function(updatedItem){
            updatedItem.snapshot['entity:title'].should.equal(updatedTitle);
            return done();
          });
        });}).catch(undesiredErr(done));

    });

    it('should be updated when its local serie entity title changes', function(done){
      createWork()
      .then(workEntity => authReq('post', '/api/items', { entity: workEntity.uri, lang: 'en' })
      .delay(200)
      .then(item => addSerie(workEntity)
      .delay(200)
      .then(function(serieEntity){
        const title = _.values(serieEntity.labels)[0];
        return getItem(item)
        .then(function(updatedItem){
          updatedItem.snapshot['entity:series'].should.equal(title);
          const updatedTitle = title + '-updated';
          return updateLabel(serieEntity._id, 'en', updatedTitle)
          .delay(200)
          .then(() => getItem(item))
          .then(function(reupdatedItem){
            reupdatedItem.snapshot['entity:series'].should.equal(updatedTitle);
            return done();
          });
        });
      }))).catch(undesiredErr(done));

    });

    it('should be updated when its local author entity title changes (edition entity)', function(done){
      ensureEditionExists('isbn:9788389920935', null, {
        labels: {},
        claims: {
          'wdt:P31': [ 'wd:Q3331189' ],
          'wdt:P212': [ '978-83-89920-93-5' ],
          'wdt:P1476': [ 'some title' ]
        }
      })
      .then(function(editionDoc){
        const workUri = editionDoc.claims['wdt:P629'][0];
        return getByUris(workUri);}).then(function(res){
        const workEntity = _.values(res.entities)[0];
        const trueAuthorUri = workEntity.claims['wdt:P50'][0];
        return authReq('post', '/api/items', { entity: 'isbn:9788389920935' })
        .delay(200)
        .then(function(item){
          const updateAuthorName = humanName();
          return updateLabel(trueAuthorUri, 'en', updateAuthorName)
          .delay(200)
          .then(() => getItem(item))
          .then(function(updatedItem){
            updatedItem.snapshot['entity:authors'].should.equal(updateAuthorName);
            return done();
          });
        });}).catch(undesiredErr(done));

    });

    it('should be updated when its local author entity title changes (work entity)', function(done){
      createWorkWithAuthor()
      .then(workEntity => authReq('post', '/api/items', { entity: workEntity.uri, lang: 'en' })
      .then(function(item){
        const updateAuthorName = humanName();
        const uri = workEntity.claims['wdt:P50'][0];
        return updateLabel(uri, 'en', updateAuthorName)
        .delay(100)
        .then(() => getItem(item))
        .then(function(item){
          item.snapshot['entity:authors'].should.equal(updateAuthorName);
          return done();
        });
      })).catch(undesiredErr(done));

    });

    it('should be updated when its local work entity is merged (work entity)', function(done){
      Promise.all([
        getUserId(),
        createWork(),
        createWork()
      ])
      .spread((userId, workEntityA, workEntityB) => authReq('post', '/api/items', { entity: workEntityA.uri, lang: 'en' })
      .tap(() => merge(workEntityA.uri, workEntityB.uri))
      .then(getItem)
      .then(function(updatedItem){
        const updatedTitle = workEntityB.labels.en;
        updatedItem.snapshot['entity:title'].should.equal(updatedTitle);
        return done();
      })).catch(undesiredErr(done));

    });

    it('should be updated when its local work entity is merged (edition entity)', function(done){
      Promise.all([
        getUserId(),
        createWork(),
        createWork()
      ])
      .spread((userId, workEntityA, workEntityB) => createEditionFromWorks(workEntityA)
      .then(editionEntity => Promise.all([
        authReq('post', '/api/items', { entity: editionEntity.uri }),
        addAuthor(workEntityB)
      ])
      .delay(200)
      .tap(() => merge(workEntityA.uri, workEntityB.uri))
      .delay(200)
      .spread((item, addedAuthor) => getItem(item)
      .then(function(updatedItem){
        const authorName = _.values(addedAuthor.labels)[0];
        updatedItem.snapshot['entity:authors'].should.equal(authorName);
        return done();
      })))).catch(undesiredErr(done));

    });

    it('should be updated when its local author entity is merged', function(done){
      Promise.all([
        getUserId(),
        createHuman(),
        createHuman()
      ])
      .spread((userId, authorEntityA, authorEntityB) => createWorkWithAuthor(authorEntityA)
      .then(workEntity => authReq('post', '/api/items', { entity: workEntity.uri, lang: 'en' }))
      .delay(200)
      .tap(() => merge(authorEntityA.uri, authorEntityB.uri))
      .delay(200)
      .then(getItem)
      .then(function(updatedItem){
        const updatedAuthors = authorEntityB.labels.en;
        updatedItem.snapshot['entity:authors'].should.equal(updatedAuthors);
        return done();
      })).catch(undesiredErr(done));

    });

    it('should be updated when its local author entity is merged and reverted', function(done){
      Promise.all([
        getUserId(),
        createHuman(),
        createHuman()
      ])
      .spread((userId, authorEntityA, authorEntityB) => createWorkWithAuthor(authorEntityA)
      .then(workEntity => authReq('post', '/api/items', { entity: workEntity.uri, lang: 'en' }))
      .delay(200)
      .tap(() => merge(authorEntityA.uri, authorEntityB.uri))
      .delay(200)
      .then(getItem)
      .then(function(updatedItem){
        const updatedAuthors = authorEntityB.labels.en;
        updatedItem.snapshot['entity:authors'].should.equal(updatedAuthors);
        return revertMerge(authorEntityA.uri)
        .delay(200)
        .then(() => getItem(updatedItem))
        .then(function(reupdatedItem){
          const oldAuthors = authorEntityA.labels.en;
          reupdatedItem.snapshot['entity:authors'].should.equal(oldAuthors);
          return done();
        });
      })).catch(undesiredErr(done));

    });

    it('should be updated when its entity changes', function(done){
      Promise.all([
        getUserId(),
        createWork()
      ])
      .spread((userId, workEntityA) => Promise.all([
        createEditionFromWorks(workEntityA),
        authReq('post', '/api/items', { entity: workEntityA.uri, lang: 'en' })
      ])
      .delay(100)
      .spread((editionEntity, item) => getItem(item)
      .then(function(item){
        item.entity = editionEntity.uri;
        return authReq('put', '/api/items', item);}).then(function(updatedItem){
        const editionTitle = editionEntity.claims['wdt:P1476'][0];
        updatedItem.snapshot['entity:title'].should.equal(editionTitle);
        return done();
      }))).catch(undesiredErr(done));

    });

    it('should be updated when its remote work entity changes', function(done){
      // Simulating a change on the Wikidata work by merging an inv work into it
      Promise.all([
        getUserId(),
        createWork()
      ])
      .spread((userId, workEntity) => createEditionFromWorks(workEntity)
      .then(editionEntity => authReq('post', '/api/items', { entity: editionEntity.uri })
      .tap(() => merge(workEntity.uri, 'wd:Q3209796'))
      .delay(1000)
      .then(item => getItem(item)
      .then(function(updatedItem){
        updatedItem.snapshot['entity:authors'].should.equal('Alain Damasio');
        return done();
      })))).catch(undesiredErr(done));

    });

    return it('should be updated when its remote author entity changes', function(done){
      // Simulating a change on the Wikidata author by merging an inv author into it
      createWork()
      .then(work => Promise.all([
        createEdition({ work }),
        addAuthor(work)
      ])
      .spread((edition, author) => authReq('post', '/api/items', { entity: edition.uri })
      .delay(200)
      .tap(() => merge(author.uri, 'wd:Q2829704'))
      .delay(200)
      .then(item => getItem(item)
      .then(function(updatedItem){
        updatedItem.snapshot['entity:authors'].should.equal('Alain Damasio');
        return done();
      })))).catch(undesiredErr(done));

    });
  });
});
