require('should')
const { checkEntities } = require('../utils/tasks')
const { getByUris, findOrIndexEntities } = require('../utils/entities')
const { createHuman, createWorkWithAuthor, randomLabel } = require('../fixtures/entities')

describe('tasks:automerge', () => {
  before(async () => {
    // Tests dependency: having a populated ElasticSearch wikidata index
    const wikidataUris = [ 'wd:Q205739', 'wd:Q1748845', 'wd:Q2829704', 'wd:Q2300248' ]
    await findOrIndexEntities(wikidataUris)
  })
  it('should automerge if author has homonyms but only one has occurrences', done => {
    const humanLabel = 'Alan Moore' // homonyms wd:Q205739, wd:Q1748845
    const wdUri = 'wd:Q205739'
    const workLabel = 'Voice of the Fire' // wd:Q3825051, Alan Moore's work
    createHuman({ labels: { en: humanLabel } })
    .then(human => {
      return createWorkWithAuthor(human, workLabel)
      .then(() => checkEntities(human.uri))
      .then(tasks => tasks.length.should.equal(0))
      .then(() => {
        return getByUris(human.uri)
        .then(({ entities }) => entities)
        .then(entities => {
          // entity should have merged, thus URI is now a WD uri
          entities[wdUri].should.be.ok()
          done()
        })
      })
    })
    .catch(done)
  })

  it('should automerge if suspect and suggestion inv works labels match', done => {
    const humanLabel = 'Alain Damasio' // wd:Q2829704
    const wikidataUri = 'wd:Q2829704'
    const workLabel = randomLabel()
    createHuman({ labels: { en: humanLabel } })
    .then(human => {
      return Promise.all([
        createWorkWithAuthor({ uri: wikidataUri }, workLabel),
        createWorkWithAuthor(human, workLabel)
      ])
      .then(() => checkEntities(human.uri))
      .then(() => {
        return getByUris(human.uri)
        .then(({ entities }) => entities)
        .then(entities => {
          entities[wikidataUri].should.be.ok()
          done()
        })
      })
    })
    .catch(done)
  })

  it('should not automerge if author name is in work title', done => {
    const humanLabel = 'Frédéric Lordon'
    const workLabel = humanLabel
    createHuman({ labels: { en: humanLabel } })
    .then(human => {
      return createWorkWithAuthor(human, workLabel)
      .then(() => checkEntities(human.uri))
      .then(tasks => {
        tasks.length.should.aboveOrEqual(1)
        const firstOccurenceMatch = tasks[0].externalSourcesOccurrences[0].matchedTitles[0]
        firstOccurenceMatch.should.equal(humanLabel)
        done()
      })
    })
    .catch(done)
  })
})
