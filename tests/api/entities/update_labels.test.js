// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const should = require('should')
const { undesiredRes, undesiredErr } = require('../utils/utils')
const { createHuman } = require('../fixtures/entities')
const { getByUri, updateLabel } = require('../utils/entities')

const humanPromise = createHuman()

describe('entities:update-labels', () => {
  it('should update a label', done => {
    humanPromise
    .then(human => {
      return updateLabel(human._id, 'fr', 'foo')
      .then(() => getByUri(human.uri))
      .then(updatedHuman => {
        updatedHuman.labels.fr.should.equal('foo')
        done()
      })
    })
    .catch(undesiredErr(done))
  })

  it('should reject an update with an invalid lang', done => {
    humanPromise
    .then(human => updateLabel(human._id, 'zz', 'foo'))
      .then(undesiredRes(done))
      .catch(err => {
        err.statusCode.should.equal(400)
        err.body.status_verbose.should.startWith('invalid lang')
        done()
      })
      .catch(undesiredErr(done))
  })

  it('should reject an update with an invalid value', done => {
    humanPromise
    .then(human => updateLabel(human._id, 'en', 123))
      .then(undesiredRes(done))
      .catch(err => {
        err.statusCode.should.equal(400)
        err.body.status_verbose.should.startWith('invalid value')
        done()
      })
      .catch(undesiredErr(done))
  })

  it('should reject an up-to-date value', done => {
    humanPromise
    .then(human => updateLabel(human._id, 'en', 'foo')
    .catch(undesiredErr(done))
    .then(() => updateLabel(human._id, 'en', 'foo'))
    .then(undesiredRes(done))
    .catch(err => {
      err.statusCode.should.equal(400)
      err.body.status_verbose.should.startWith('already up-to-date')
      done()
    })).catch(undesiredErr(done))
  })

  it('should accept rapid updates on the same entity', done => {
    const name = 'Georges'
    const langs = [ 'en', 'fr' ]
    humanPromise
    .then(human => {
      const { _id: humanId } = human
      return Promise.all(langs.map(lang => updateLabel(humanId, lang, name)))
      .then(responses => {
        responses.forEach(res => should(res.ok).be.true())
        return getByUri(human.uri)
        .then(updatedHuman => {
          langs.forEach(lang => updatedHuman.labels[lang].should.equal(name))
          done()
        })
      })
    })
    .catch(undesiredErr(done))
  })
})
