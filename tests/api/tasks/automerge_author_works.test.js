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
const { Promise } = __.require('lib', 'promises')
require('should')

const automergeAuthorWorks = __.require('controllers', 'tasks/lib/automerge_author_works')
const { undesiredErr } = require('../utils/utils')
const { checkEntities } = require('../utils/tasks')
const { getByUris } = require('../utils/entities')
const { createHuman, createWorkWithAuthor, createWorkWithAuthorAndSerie, randomLabel, addSerie } = require('../fixtures/entities')

describe('automerge_author_works: only from inv works to wd works', () => {
  it('should automerge inv works to a wd work', done => {
    // Alan Moore uri
    const authorUri = 'wd:Q205739'
    const workLabel = 'Voice of the Fire'
    const workWdUri = 'wd:Q3825051' // 'Voice of the Fire' uri

    Promise.all([
      createWorkWithAuthor({ uri: authorUri }, workLabel),
      createWorkWithAuthor({ uri: authorUri }, workLabel)
    ])
    .spread((work1, work2) => automergeAuthorWorks(authorUri)
    .delay(300)
    .then(() => getByUris([ work1.uri, work2.uri ]))
    .then(res => {
      res.redirects[work1.uri].should.equal(workWdUri)
      res.redirects[work2.uri].should.equal(workWdUri)
      done()
    })).catch(undesiredErr(done))
  })

  it('should automerge if suspect and suggestion wd and inv short works labels match', done => {
    const humanLabel = 'Michael Crichton'
    const humanWdUri = 'wd:Q172140'
    const workLabel = 'Timeline' // wd:Q732060
    const workWdUri = 'wd:Q732060'
    createHuman({ labels: { en: humanLabel } })
    .then(human => createWorkWithAuthor({ uri: human.uri }, workLabel)
    .then(work => checkEntities(human.uri)
    .then(_.Log('tasks'))
    .then(tasks => {
      tasks.length.should.equal(0)
      return getByUris(work.uri)
      .then(res => {
        res.redirects[work.uri].should.equal(workWdUri)
        done()
      })
    }))).catch(undesiredErr(done))
  })

  it('should not automerge if authors works do not match', done => {
    // Alan Moore uri
    const authorUri = 'wd:Q205739'
    // Corresponding to wd:Q3825051 label
    const workLabel = 'Voice of the Fire'

    createWorkWithAuthor({ uri: authorUri }, `${workLabel} Vol. 1`)
    .then(invWork => automergeAuthorWorks(authorUri)
    .delay(300)
    .then(() => getByUris(invWork.uri))
    .then(res => {
      res.entities[invWork.uri].should.be.ok()
      done()
    })).catch(undesiredErr(done))
  })

  it('should not automerge work if suggestion is a serie or part of a serie', done => {
    // Alan Moore uri
    const authorUri = 'wd:Q205739'
    // Corresponding to wd:Q3825051 label
    const workLabel = 'Voice of the Fire'

    createWorkWithAuthor({ uri: authorUri }, workLabel)
    .tap(invWork => addSerie(invWork))
    .delay(300)
    .then(invWork => automergeAuthorWorks(authorUri)
    .delay(300)
    .then(() => getByUris(invWork.uri))
    .then(res => {
      res.entities[invWork.uri].should.be.ok()
      done()
    })).catch(undesiredErr(done))
  })
})
