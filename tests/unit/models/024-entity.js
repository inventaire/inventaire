/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const CONFIG = require('config');
const __ = CONFIG.universalPath;
const _ = __.require('builders', 'utils');
const should = require('should');

const Entity = __.require('models', 'entity');

const workDoc = function() {
  const doc = Entity.create();
  doc._id = '12345678900987654321123456789012';
  doc._rev = '5-12345678900987654321123456789012';
  doc.claims['wdt:P31'] = ['wd:Q571'];
  doc.claims['wdt:P50'] = ['wd:Q535', 'wd:Q1541'];
  doc.created = Date.now();
  doc.updated = Date.now();
  return doc;
};

const editionDoc = function() {
  const doc = Entity.create();
  doc._id = '22345678900987654321123456789012';
  doc.claims['wdt:P31'] = ['wd:Q3331189'];
  doc.claims['wdt:P629'] = ['wd:Q53592'];
  doc.created = Date.now();
  doc.updated = Date.now();
  return doc;
};

// coffeelint: disable=no_unnecessary_double_quotes
const nonTrimedString = `\

      foo
bar
\
`;


describe('entity model', function() {
  describe('create', () => it('should return an object with type entity and a claims object', function(done){
    const now = Date.now();
    const entityDoc = Entity.create();
    entityDoc.should.be.an.Object();
    entityDoc.type.should.equal('entity');
    entityDoc.labels.should.be.an.Object();
    entityDoc.claims.should.be.an.Object();
    entityDoc.created.should.be.a.Number();
    entityDoc.created.should.be.aboveOrEqual(now);
    entityDoc.created.should.be.below(now + 10);
    entityDoc.updated.should.be.ok();
    return done();
  }));

  describe('create claim', function() {
    it('should add a claim value', function(done){
      const doc = Entity.createClaim(workDoc(), 'wdt:P50', 'wd:Q42');
      _.last(doc.claims['wdt:P50']).should.equal('wd:Q42');
      return done();
    });

    it('should update the timestamp', function(done){
      const now = Date.now();
      const entityDoc = Entity.createClaim(workDoc(), 'wdt:P50', 'wd:Q42');
      entityDoc.updated.should.be.a.Number();
      entityDoc.updated.should.be.aboveOrEqual(now);
      entityDoc.updated.should.be.below(now + 10);
      return done();
    });

    it('should return a doc with the new value for an existing property', function(done){
      const entityDoc = workDoc();
      const lengthBefore = entityDoc.claims['wdt:P50'].length;
      const updatedDoc = Entity.createClaim(entityDoc, 'wdt:P50', 'wd:Q42');
      updatedDoc.claims['wdt:P50'].length.should.equal(lengthBefore + 1);
      const updatedDoc2 = Entity.createClaim(entityDoc, 'wdt:P135', 'wd:Q53121');
      updatedDoc2.claims['wdt:P135'][0].should.equal('wd:Q53121');
      return done();
    });

    it('should return a doc with the new value for a new property', function(done){
      const updatedDoc = Entity.createClaim(workDoc(), 'wdt:P135', 'wd:Q53121');
      updatedDoc.claims['wdt:P135'][0].should.equal('wd:Q53121');
      return done();
    });

    it('should return a doc with the new value added last', function(done){
      const updatedDoc = Entity.createClaim(workDoc(), 'wdt:P50', 'wd:Q42');
      updatedDoc.claims['wdt:P50'].slice(-1)[0].should.equal('wd:Q42');
      return done();
    });

    return it('should throw if the new value already exist', function(done){
      const entityDoc = workDoc();
      const updater = () => Entity.createClaim(entityDoc, 'wdt:P50', 'wd:Q1541');
      updater.should.throw();
      return done();
    });
  });

  return describe('update claim', function() {
    describe('create claim', function() {
      it('should not throw if not passed an old value', function(done){
        const updater = () => Entity.updateClaim(workDoc(), 'wdt:P50', null, 'wd:Q42');
        updater.should.not.throw();
        return done();
      });

      it('should update the timestamp', function(done){
        const now = Date.now();
        const entityDoc = workDoc();
        const update = function() {
          const updatedDoc = Entity.updateClaim(entityDoc, 'wdt:P135', null, 'wd:Q53121');
          updatedDoc.updated.should.be.a.Number();
          updatedDoc.updated.should.be.above(now);
          updatedDoc.updated.should.be.below(now + 10);
          return done();
        };
        return setTimeout(update, 5);
      });

      it('should return a doc with the new value for an existing property', function(done){
        const entityDoc = workDoc();
        const lengthBefore = entityDoc.claims['wdt:P50'].length;
        const updatedDoc = Entity.updateClaim(entityDoc, 'wdt:P50', null, 'wd:Q42');
        updatedDoc.claims['wdt:P50'].length.should.equal(lengthBefore + 1);
        const updatedDoc2 = Entity.updateClaim(entityDoc, 'wdt:P135', null, 'wd:Q53121');
        updatedDoc2.claims['wdt:P135'][0].should.equal('wd:Q53121');
        return done();
      });

      it('should return a doc with the new value for a new property', function(done){
        const updatedDoc = Entity.updateClaim(workDoc(), 'wdt:P135', null, 'wd:Q53121');
        updatedDoc.claims['wdt:P135'][0].should.equal('wd:Q53121');
        return done();
      });

      it('should return a doc with the new value added last', function(done){
        const updatedDoc = Entity.updateClaim(workDoc(), 'wdt:P50', null, 'wd:Q42');
        updatedDoc.claims['wdt:P50'].slice(-1)[0].should.equal('wd:Q42');
        return done();
      });

      it('should throw if the new value already exist', function(done){
        const entityDoc = workDoc();
        const updater = () => Entity.updateClaim(entityDoc, 'wdt:P50', null, 'wd:Q1541');
        updater.should.throw();
        return done();
      });

      it('should add inferred properties value', function(done){
        const entityDoc = Entity.updateClaim(workDoc(), 'wdt:P212', null, '978-2-7073-0152-9');
        _.warn(entityDoc.claims, 'entityDoc.claims');
        entityDoc.claims['wdt:P957'][0].should.equal('2-7073-0152-3');
        entityDoc.claims['wdt:P407'][0].should.equal('wd:Q150');
        return done();
      });

      return it('should add no inferred properties value when none is found', function(done){
        // the invalid isbn would have been rejected upfront but here allows
        // to tests cases where inferred properties convertors will fail to find a value
        const entityDoc = Entity.updateClaim(workDoc(), 'wdt:P212', null, '978-invalid isbn');
        should(entityDoc.claims['wdt:P957']).not.be.ok();
        should(entityDoc.claims['wdt:P407']).not.be.ok();
        return done();
      });
    });

    it('should trim values', function(done){
      const updatedDoc = Entity.updateClaim(editionDoc(), 'wd:P1476', null, nonTrimedString);
      updatedDoc.claims['wd:P1476'][0].should.equal('foo bar');
      return done();
    });

    describe('update existing claim', function() {
      it('should return with the claim value updated', function(done){
        const entityDoc = workDoc();
        entityDoc.claims['wdt:P50'][0].should.equal('wd:Q535');
        const updatedDoc = Entity.updateClaim(entityDoc, 'wdt:P50', 'wd:Q535', 'wd:Q42');
        updatedDoc.claims['wdt:P50'][0].should.equal('wd:Q42');
        return done();
      });

      it("should throw if the old value doesn't exist", function(done){
        const entityDoc = workDoc();
        const updater = () => Entity.updateClaim(entityDoc, 'wdt:P50', 'wd:Q1', 'wd:Q42');
        updater.should.throw();
        return done();
      });

      it('should throw if the new value already exist', function(done){
        const entityDoc = workDoc();
        const updater = () => Entity.updateClaim(entityDoc, 'wdt:P50', 'wd:Q535', 'wd:Q1541');
        updater.should.throw();
        return done();
      });

      return it('should update the timestamp', function(done){
        const now = Date.now();
        const entityDoc = workDoc();
        entityDoc.claims['wdt:P50'][0].should.equal('wd:Q535');
        const update = function() {
          const updatedDoc = Entity.updateClaim(entityDoc, 'wdt:P50', 'wd:Q535', 'wd:Q42');
          updatedDoc.claims['wdt:P50'][0].should.equal('wd:Q42');
          updatedDoc.updated.should.be.a.Number();
          updatedDoc.updated.should.be.above(now);
          updatedDoc.updated.should.be.below(now + 10);
          return done();
        };

        return setTimeout(update, 5);
      });
    });

    describe('delete claim', function() {
      it('should return with the claim value removed if passed an undefined new value', function(done){
        const updatedDoc = Entity.updateClaim(workDoc(), 'wdt:P50', 'wd:Q535', null);
        updatedDoc.claims['wdt:P50'].length.should.equal(1);
        return done();
      });

      it('should remove the property array if empty', function(done){
        const updatedDoc = Entity.updateClaim(workDoc(), 'wdt:P50', 'wd:Q535', null);
        const updatedDoc2 = Entity.updateClaim(updatedDoc, 'wdt:P50', 'wd:Q1541', null);
        should(updatedDoc2.claims['wdt:P50']).not.be.ok();
        return done();
      });

      it("should throw if the old value doesn't exist", function(done){
        const entityDoc = workDoc();
        const updater = () => Entity.updateClaim(entityDoc, 'wdt:P50', 'wd:Q1', null);
        updater.should.throw();
        return done();
      });

      it('should remove inferred properties value', function(done){
        let entityDoc = Entity.updateClaim(workDoc(), 'wdt:P212', null, '978-2-7073-0152-9');
        entityDoc = Entity.updateClaim(entityDoc, 'wdt:P212', '978-2-7073-0152-9', null);
        should(entityDoc.claims['wdt:P957']).not.be.ok();
        should(entityDoc.claims['wdt:P407']).not.be.ok();
        return done();
      });

      it('should throw if a critical property got zero claims', function(done){
        const doc = editionDoc();
        const updater = () => Entity.updateClaim(doc, 'wdt:P629', 'wd:Q53592', null);
        updater.should.throw('this property should at least have one value');
        return done();
      });

      return it('should update the timestamp', function(done){
        const now = Date.now();
        const entityDoc = workDoc();
        entityDoc.updated.should.be.a.Number();
        entityDoc.updated.should.be.aboveOrEqual(now);
        entityDoc.updated.should.be.below(now + 10);
        const update = function() {
          const updatedDoc = Entity.updateClaim(entityDoc, 'wdt:P50', 'wd:Q535', null);
          updatedDoc.updated.should.be.a.Number();
          updatedDoc.updated.should.be.above(now);
          updatedDoc.updated.should.be.below(now + 10);
          return done();
        };

        return setTimeout(update, 5);
      });
    });

    describe('set label', function() {
      it('should set the label in the given lang', function(done){
        const entityDoc = workDoc();
        Entity.setLabel(entityDoc, 'fr', 'hello');
        entityDoc.labels.fr.should.equal('hello');
        return done();
      });

      it('should throw if no lang is passed', function(done){
        const entityDoc = workDoc();
        const updater = () => Entity.setLabel(entityDoc, null, 'hello');
        updater.should.throw();
        return done();
      });

      it('should throw if an invalid lang is passed', function(done){
        const entityDoc = workDoc();
        const updater = () => Entity.setLabel(entityDoc, 'zz', 'hello');
        updater.should.throw();
        return done();
      });

      it('should throw if the current and the updated label are equal', function(done){
        const entityDoc = workDoc();
        const updater = function() {
          Entity.setLabel(entityDoc, 'en', 'foo');
          return Entity.setLabel(entityDoc, 'en', 'foo');
        };
        updater.should.throw();
        try { updater(); }
        catch (err) { err.message.should.equal('already up-to-date'); }
        return done();
      });

      it('should trim labels', function(done){
        const entityDoc = workDoc();
        Entity.setLabel(entityDoc, 'fr', nonTrimedString);
        entityDoc.labels.fr.should.equal('foo bar');
        return done();
      });

      return it('should update the timestamp', function(done){
        const entityDoc = workDoc();
        const initialTimestamp = entityDoc.updated;
        entityDoc.updated.should.be.a.Number();
        const update = function() {
          const updatedDoc = Entity.setLabel(entityDoc, 'fr', 'hello');
          updatedDoc.updated.should.be.a.Number();
          updatedDoc.updated.should.be.above(initialTimestamp);
          updatedDoc.updated.should.be.below(initialTimestamp + 10);
          return done();
        };
        return setTimeout(update, 5);
      });
    });

    describe('merge', function() {
      it('should transfer labels', function(done){
        const entityA = workDoc();
        const entityB = workDoc();
        Entity.setLabel(entityA, 'da', 'foo');
        Entity.mergeDocs(entityA, entityB);
        entityB.labels.da.should.equal('foo');
        return done();
      });

      it('should not override existing labels', function(done){
        const entityA = workDoc();
        const entityB = workDoc();
        Entity.setLabel(entityA, 'da', 'foo');
        Entity.setLabel(entityB, 'da', 'bar');
        Entity.mergeDocs(entityA, entityB);
        entityB.labels.da.should.equal('bar');
        return done();
      });

      it('should transfer claims', function(done){
        const entityA = workDoc();
        const entityB = workDoc();
        Entity.createClaim(entityA, 'wdt:P921', 'wd:Q3');
        Entity.mergeDocs(entityA, entityB);
        entityB.claims['wdt:P921'].should.deepEqual([ 'wd:Q3' ]);
        return done();
      });

      it('should add new claims on already used property', function(done){
        const entityA = workDoc();
        const entityB = workDoc();
        Entity.createClaim(entityA, 'wdt:P921', 'wd:Q3');
        Entity.createClaim(entityB, 'wdt:P921', 'wd:Q1');
        Entity.mergeDocs(entityA, entityB);
        entityB.claims['wdt:P921'].should.deepEqual([ 'wd:Q1', 'wd:Q3' ]);
        return done();
      });

      it('should not add new claims on already used property linking to potential placeholders', function(done){
        const entityA = workDoc();
        const entityB = workDoc();
        entityB.claims['wdt:P50'] = [ 'wd:Q1' ];
        Entity.mergeDocs(entityA, entityB);
        entityB.claims['wdt:P50'].should.deepEqual([ 'wd:Q1' ]);
        return done();
      });

      it('should not create duplicated claims', function(done){
        const entityA = workDoc();
        const entityB = workDoc();
        Entity.createClaim(entityA, 'wdt:P921', 'wd:Q3');
        Entity.createClaim(entityB, 'wdt:P921', 'wd:Q3');
        Entity.mergeDocs(entityA, entityB);
        entityB.claims['wdt:P921'].should.deepEqual([ 'wd:Q3' ]);
        return done();
      });

      it('should update the timestamp', function(done){
        const entityA = workDoc();
        const entityB = workDoc();
        Entity.createClaim(entityA, 'wdt:P921', 'wd:Q3');
        const now = Date.now();
        const update = function() {
          Entity.mergeDocs(entityA, entityB);
          entityB.updated.should.be.a.Number();
          entityB.updated.should.be.above(now);
          entityB.updated.should.be.below(now + 10);
          return done();
        };
        return setTimeout(update, 5);
      });

      it('should not update the timestamp if no data was transfered', function(done){
        const entityA = workDoc();
        const entityB = workDoc();
        Entity.createClaim(entityA, 'wdt:P921', 'wd:Q3');
        Entity.createClaim(entityB, 'wdt:P921', 'wd:Q3');
        const initialTimestamp = entityB.updated;
        const update = function() {
          Entity.mergeDocs(entityA, entityB);
          entityB.updated.should.equal(initialTimestamp);
          return done();
        };
        return setTimeout(update, 5);
      });

      it('should keep the target claim in case of claim uniqueness restrictions', function(done){
        const entityA = workDoc();
        const entityB = workDoc();
        Entity.createClaim(entityA, 'wdt:P648', 'OL123456W');
        Entity.createClaim(entityB, 'wdt:P648', 'OL123457W');
        Entity.mergeDocs(entityA, entityB).claims['wdt:P648'].should.deepEqual([ 'OL123457W' ]);
        return done();
      });

      return it('should refuse to merge redirections', function(done){
        const redirection = { redirect: 'wd:Q1' };
        const entity = workDoc();
        ((() => Entity.mergeDocs(redirection, entity)))
        .should.throw('mergeDocs (from) failed: the entity is a redirection');
        ((() => Entity.mergeDocs(entity, redirection)))
        .should.throw('mergeDocs (to) failed: the entity is a redirection');
        return done();
      });
    });

    describe('turnIntoRedirection', function() {
      it('should return a redirection doc', function(done){
        const fromEntityDoc = workDoc();
        const toUri = 'wd:Q3209796';
        const redirection = Entity.turnIntoRedirection(fromEntityDoc, toUri);
        redirection.should.be.an.Object();
        redirection._id.should.equal(fromEntityDoc._id);
        redirection._rev.should.equal(fromEntityDoc._rev);
        redirection.redirect.should.equal(toUri);
        should(redirection.claims).not.be.ok();
        should(redirection.labels).not.be.ok();
        redirection.created.should.equal(fromEntityDoc.created);
        redirection.updated.should.be.ok();
        return done();
      });

      it('should be a different object', function(done){
        const fromEntityDoc = workDoc();
        const toUri = 'wd:Q3209796';
        const redirection = Entity.turnIntoRedirection(fromEntityDoc, toUri);
        should(redirection === fromEntityDoc).not.be.true();
        return done();
      });

      return it('should update the timestamp', function(done){
        const fromEntityDoc = workDoc();
        const toUri = 'wd:Q3209796';
        const redirect = function() {
          const redirection = Entity.turnIntoRedirection(fromEntityDoc, toUri);
          redirection.should.be.an.Object();
          redirection._id.should.equal(fromEntityDoc._id);
          redirection._rev.should.equal(fromEntityDoc._rev);
          redirection._rev.should.equal(fromEntityDoc._rev);
          redirection.redirect.should.equal(toUri);
          redirection.updated.should.be.above(fromEntityDoc.updated);
          return done();
        };

        return setTimeout(redirect, 5);
      });
    });

    return describe('removePlaceholder', function() {
      it('should return a removed placeholder doc', function(done){
        const entity = workDoc();
        const removedPlaceholder = Entity.removePlaceholder(entity);
        removedPlaceholder.should.be.an.Object();
        removedPlaceholder.labels.should.deepEqual(entity.labels);
        removedPlaceholder.claims.should.deepEqual(entity.claims);
        return done();
      });

      it('should be a different object', function(done){
        const entity = workDoc();
        const removedPlaceholder = Entity.removePlaceholder(entity);
        should(removedPlaceholder === entity).not.be.true();
        return done();
      });

      return it('should update the timestamp', function(done){
        const entity = workDoc();
        const remove = function() {
          const removedPlaceholder = Entity.removePlaceholder(entity);
          removedPlaceholder.updated.should.be.above(entity.updated);
          return done();
        };
        return setTimeout(remove, 5);
      });
    });
  });
});
