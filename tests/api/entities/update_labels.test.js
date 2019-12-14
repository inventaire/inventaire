const __ = require('config').universalPath
const should = require('should')
const { authReq, undesiredRes } = require('../utils/utils')
const { createHuman } = require('../fixtures/entities')
const { getByUri, updateLabel } = require('../utils/entities')
const randomString = __.require('lib', 'utils/random_string')
const humanPromise = createHuman()

describe('entities:update-labels', () => {
  it('should reject without value', done => {
    humanPromise
    .then(human => {
      updateLabel(human._id, 'fr', null)
      .then(undesiredRes(done))
      .catch(err => {
        err.body.status_verbose.should.equal('missing parameter in body: value')
        err.statusCode.should.equal(400)
        done()
      })
    })
    .catch(done)
  })

  it('should update without lang parameter, english as default', done => {
    const value = randomString(15)
    humanPromise
    .then(human => {
      const body = {
        uri: human.uri,
        value
      }
      authReq('put', '/api/entities?action=update-label', body)
      .then(() => getByUri(human.uri))
      .then(updatedHuman => {
        updatedHuman.labels.en.should.equal(value)
        done()
      })
    })
    .catch(done)
  })

  it('should accept an entity id instead of uri', done => {
    const value = randomString(15)
    humanPromise
    .then(human => {
      const body = {
        id: human._id,
        lang: 'fr',
        value
      }
      authReq('put', '/api/entities?action=update-label', body)
      .then(() => getByUri(human.uri))
      .then(updatedHuman => {
        updatedHuman.labels.fr.should.equal(value)
        done()
      })
    })
    .catch(done)
  })

  it('should update a label', done => {
    const value = randomString(15)
    humanPromise
    .then(human => {
      updateLabel(human._id, 'fr', value)
      .then(() => getByUri(human.uri))
      .then(updatedHuman => {
        updatedHuman.labels.fr.should.equal(value)
        done()
      })
    })
    .catch(done)
  })

  it('should trim a label', done => {
    const trimValue = randomString(15)
    const trimValueLength = trimValue.length
    const value = `${trimValue}     `
    humanPromise
    .then(human => {
      updateLabel(human._id, 'fr', value)
      .then(() => getByUri(human.uri))
      .then(updatedHuman => {
        updatedHuman.labels.fr.length.should.equal(trimValueLength)
        done()
      })
    })
    .catch(done)
  })

  it('should reject an update with an invalid lang', done => {
    const value = randomString(15)
    humanPromise
    .then(human => updateLabel(human._id, 'zz', value))
      .then(undesiredRes(done))
      .catch(err => {
        err.statusCode.should.equal(400)
        err.body.status_verbose.should.startWith('invalid lang')
        done()
      })
      .catch(done)
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
      .catch(done)
  })

  it('should reject an up-to-date value', done => {
    const value = randomString(15)
    humanPromise
    .then(human => {
      updateLabel(human._id, 'en', value)
      .catch(done)
      .then(() => updateLabel(human._id, 'en', value))
      .then(undesiredRes(done))
      .catch(err => {
        err.statusCode.should.equal(400)
        err.body.status_verbose.should.startWith('already up-to-date')
        done()
      })
    })
    .catch(done)
  })

  it('should accept rapid updates on the same entity', done => {
    const name = 'Georges'
    const langs = [ 'en', 'fr' ]
    humanPromise
    .then(human => {
      const { _id: humanId } = human
      Promise.all(langs.map(lang => updateLabel(humanId, lang, name)))
      .then(responses => {
        responses.forEach(res => should(res.ok).be.true())
        getByUri(human.uri)
        .then(updatedHuman => {
          langs.forEach(lang => updatedHuman.labels[lang].should.equal(name))
          done()
        })
      })
    })
    .catch(done)
  })
})
