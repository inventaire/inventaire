/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const should = require('should');
const { undesiredErr } = require('../utils/utils');
const { checkEntities } = require('../utils/tasks');
const { getByUris } = require('../utils/entities');
const { createHuman, createWorkWithAuthor, randomLabel } = require('../fixtures/entities');


// Tests dependency: having a populated ElasticSearch wikidata index
describe('tasks:automerge', function() {
  it('should automerge if author has homonyms but only one has occurrences', function(done){
    const humanLabel = 'Alan Moore'; // homonyms wd:Q205739, wd:Q1748845
    const WdUri = 'wd:Q205739';
    const workLabel = 'Voice of the Fire'; // wd:Q3825051
    createHuman({ labels: { en: humanLabel } })
    .then(human => createWorkWithAuthor(human, workLabel)
    .then(() => checkEntities(human.uri))
    .then(tasks => tasks.length.should.equal(0))
    .then(() => getByUris(human.uri)
    .get('entities')
    .then(function(entities){
      // entity should have merged, thus URI is now a a WD uri
      entities[WdUri].should.be.ok();
      return done();
    }))).catch(undesiredErr(done));

  });

  it('should automerge if suspect and suggestion inv works labels match', function(done){
    const humanLabel = 'Alain Damasio'; // wd:Q2829704
    const wikidataUri = 'wd:Q2829704';
    const workLabel = randomLabel();
    createHuman({ labels: { en: humanLabel } })
    .then(human => Promise.all([
      createWorkWithAuthor({ uri: wikidataUri }, workLabel),
      createWorkWithAuthor(human, workLabel)
    ])
    .then(() => checkEntities(human.uri))
    .then(() => getByUris(human.uri)
    .get('entities')
    .then(function(entities){
      entities[wikidataUri].should.be.ok();
      return done();
    }))).catch(undesiredErr(done));

  });

  return it('should not automerge if author name is in work title', function(done){
    const humanLabel = 'Frédéric Lordon';
    const workLabel = humanLabel;
    createHuman({ labels: { en: humanLabel } })
    .then(human => createWorkWithAuthor(human, workLabel)
    .then(() => checkEntities(human.uri))
    .then(function(tasks){
      tasks.length.should.aboveOrEqual(1);
      const firstOccurenceMatch = tasks[0].externalSourcesOccurrences[0].matchedTitles[0];
      firstOccurenceMatch.should.equal(humanLabel);
      return done();
    })).catch(undesiredErr(done));

  });
});
