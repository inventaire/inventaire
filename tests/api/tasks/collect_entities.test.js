const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')
require('should')
const { wait } = __.require('lib', 'promises')
const { createHuman } = require('../fixtures/entities')
const { getBySuspectUri, collectEntities } = require('../utils/tasks')

// Tests dependency:
// - running after a database reset
// - having a populated Elasticsearch wikidata index
// Disabled to avoid crashing tests when those depdendencies aren't met
describe('tasks:collect-entities', () => {
  xit('should create new tasks', async () => {
    const humans = await Promise.all([
      createHuman({ labels: { en: 'Stanislas Lem' } }),
      createHuman({ labels: { en: 'Stanislas Lem' } })
    ])
    const uris = _.map(humans, 'uri')
    await collectEntities()
    await wait(5000)
    const tasksBySuspectUris = await Promise.all(uris.map(getBySuspectUri))
    tasksBySuspectUris.forEach(tasks => {
      tasks.length.should.aboveOrEqual(1)
    })
  })
})
