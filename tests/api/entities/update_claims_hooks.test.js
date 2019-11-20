
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const CONFIG = require('config')
const __ = CONFIG.universalPath
require('should')
const promises_ = __.require('lib', 'promises')
const { undesiredErr } = require('../utils/utils')
const { getByUris, updateClaim } = require('../utils/entities')
const { createWork, createEditionFromWorks } = require('../fixtures/entities')

describe('entities:update-claims-hooks', () => {
  it('should update a work label from an edition title update if in sync', done => {
    createWork()
    .then(work => createEditionFromWorks(work)
    .then(edition => {
      const value = edition.claims['wdt:P1476'][0]
      const updatedValue = `${value}updated`
      return updateClaim(edition.uri, 'wdt:P1476', value, updatedValue)
      .delay(100)
      .then(() => getByUris(work.uri)
      .then(res => {
        const refreshedWork = res.entities[work.uri]
        refreshedWork.labels.en.should.equal(updatedValue)
        done()
      }))
    }))
    .catch(undesiredErr(done))
  })

  it('should not update a work label if editions disagree on the title', done => {
    createWork()
    .then(work => promises_.all([
      createEditionFromWorks(work),
      createEditionFromWorks(work)
    ])
    .spread((editionA, editionB) => {
      const valueA = editionA.claims['wdt:P1476'][0]
      const updatedValueA = `${valueA}updated`
      return updateClaim(editionA.uri, 'wdt:P1476', valueA, updatedValueA)
      .delay(100)
      .then(() => getByUris(work.uri)
      .then(res => {
        const refreshedWork = res.entities[work.uri]
        refreshedWork.labels.en.should.equal(work.labels.en)
        done()
      }))
    }))
    .catch(undesiredErr(done))
  })
})
