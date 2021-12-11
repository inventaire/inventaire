require('should')
const { Wait } = require('lib/promises')
const { getByUris, updateClaim } = require('../utils/entities')
const { createWork, createEditionFromWorks } = require('../fixtures/entities')

describe('entities:update-claims-hooks', () => {
  it('should update a work label from an edition title update if in sync', done => {
    createWork()
    .then(work => {
      return createEditionFromWorks(work)
      .then(edition => {
        const value = edition.claims['wdt:P1476'][0]
        const updatedValue = `${value}updated`
        const { uri } = edition
        return updateClaim({ uri, property: 'wdt:P1476', oldValue: value, newValue: updatedValue })
        .then(Wait(100))
        .then(() => {
          return getByUris(work.uri)
          .then(res => {
            const refreshedWork = res.entities[work.uri]
            refreshedWork.labels.en.should.equal(updatedValue)
            done()
          })
        })
      })
    })
    .catch(done)
  })

  it('should not update a work label if editions disagree on the title', done => {
    createWork()
    .then(work => {
      return Promise.all([
        createEditionFromWorks(work),
        createEditionFromWorks(work)
      ])
      .then(([ editionA, editionB ]) => {
        const valueA = editionA.claims['wdt:P1476'][0]
        const updatedValueA = `${valueA}updated`
        const { uri } = editionA
        return updateClaim({ uri, property: 'wdt:P1476', oldValue: valueA, newValue: updatedValueA })
        .then(Wait(100))
        .then(() => {
          return getByUris(work.uri)
          .then(res => {
            const refreshedWork = res.entities[work.uri]
            refreshedWork.labels.en.should.equal(work.labels.en)
            done()
          })
        })
      })
    })
    .catch(done)
  })
})
