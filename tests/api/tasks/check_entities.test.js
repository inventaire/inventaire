// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')
require('should')
const { checkEntities, getBySuspectUri } = require('../utils/tasks')
const { undesiredErr, undesiredRes } = __.require('apiTests', 'utils/utils')
const { getByUris } = require('../utils/entities')
const { createHuman, createWorkWithAuthor, createWork, randomLabel } = require('../fixtures/entities')

// Tests dependency: having a populated ElasticSearch wikidata index
describe('tasks:check-entities', () => {
  it('should refuse to check entities of non-whitelisted types', done => {
    // Currently, only humans can be checked for duplicates,
    // or at least are the entrypoint for duplicate checks
    createWork()
    .then(work => checkEntities(work.uri)
    .then(undesiredRes(done))
    .catch(err => {
      err.statusCode.should.equal(400)
      err.body.status_verbose.should.equal('unsupported type: work')
      err.message
      done()
    })).catch(undesiredErr(done))
  })

  it('should create tasks for the requested URIs', done => {
    createHuman({ labels: { en: 'Fred Vargas' } })
    .then(human => checkEntities(human.uri)
    .then(tasks => {
      tasks.should.be.an.Array()
      const task = tasks[0]
      task.suspectUri.should.equal(human.uri)
      task.type.should.equal('deduplicate')
      task.suggestionUri.should.startWith('wd')
      task.lexicalScore.should.be.a.Number()
      task.relationScore.should.be.a.Number()
      task.externalSourcesOccurrences.should.be.an.Array()
      done()
    })).catch(undesiredErr(done))
  })

  it('should not re-create existing tasks', done => {
    createHuman({ labels: { en: 'Fred Vargas' } })
    .then(human => checkEntities(human.uri)
    .then(() => checkEntities(human.uri))
    .then(() => getBySuspectUri(human.uri))
    .then(tasks => {
      const uniqSuggestiontUris = _.uniq(_.map(tasks, 'suggestionUri'))
      tasks.length.should.equal(uniqSuggestiontUris.length)
      done()
    })).catch(undesiredErr(done))
  })
})

describe('tasks:automerge', () => {
  it('should automerge if author has homonyms but only one has occurrences', done => {
    const authorLabel = 'Alan Moore' // homonyms Q205739, Q1748845
    const authorWdUri = 'wd:Q205739'
    const workLabel = 'Voice of the Fire' // wd:Q3825051
    createHuman({ labels: { en: authorLabel } })
    .then(human => createWorkWithAuthor(human, workLabel)
    .then(() => checkEntities(human.uri))
    .then(tasks => tasks.length.should.equal(0))
    .then(() => getByUris(human.uri)
    .get('entities')
    .then(entities => {
      // entity should have merged, thus URI is now a a WD uri
      entities[authorWdUri].should.be.ok()
      done()
    }))).catch(undesiredErr(done))
  })

  it('should automerge if suspect and suggestion workLabel are similar', done => {
    const authorLabel = 'Alain Damasio' // wdId Q2829704
    const wikidataUri = 'wd:Q2829704'
    const workLabel = randomLabel()
    createHuman({ labels: { en: authorLabel } })
    .then(human => Promise.all([
      createWorkWithAuthor({ uri: wikidataUri }, workLabel),
      createWorkWithAuthor(human, workLabel)
    ])
    .then(() => checkEntities(human.uri))
    .then(() => getByUris(human.uri)
    .get('entities')
    .then(entities => {
      entities[wikidataUri].should.be.ok()
      done()
    }))).catch(undesiredErr(done))
  })

  it('should not automerge if author name is in work title', done => {
    const authorLabel = 'Frédéric Lordon'
    const workLabel = authorLabel
    createHuman({ labels: { en: authorLabel } })
    .then(human => createWorkWithAuthor(human, workLabel)
    .then(() => checkEntities(human.uri))
    .then(tasks => {
      tasks.length.should.aboveOrEqual(1)
      const firstOccurenceMatch = tasks[0].externalSourcesOccurrences[0].matchedTitles[0]
      firstOccurenceMatch.should.equal(authorLabel)
      done()
    })).catch(undesiredErr(done))
  })
})
