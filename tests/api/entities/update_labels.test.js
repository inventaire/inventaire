const __ = require('config').universalPath
const should = require('should')
const { authReq, shouldNotBeCalled, rethrowShouldNotBeCalledErrors } = require('../utils/utils')

const { createHuman } = require('../fixtures/entities')
const { getByUri, updateLabel } = require('../utils/entities')
const randomString = require('lib/utils/random_string')
const humanPromise = createHuman()

describe('entities:update-labels', () => {
  it('should reject without value', async () => {
    const { _id } = await humanPromise
    try {
      await updateLabel(_id, 'fr', null).then(shouldNotBeCalled)
    } catch (err) {
      rethrowShouldNotBeCalledErrors(err)
      err.body.status_verbose.should.equal('missing parameter in body: value')
      err.statusCode.should.equal(400)
    }
  })

  it('should update without lang parameter, english as default', async () => {
    const { uri } = await humanPromise
    const value = randomString(15)
    await authReq('put', '/api/entities?action=update-label', { uri, value })
    const updatedHuman = await getByUri(uri)
    updatedHuman.labels.en.should.equal(value)
  })

  it('should accept an entity id instead of uri', async () => {
    const { _id: id, uri } = await humanPromise
    const value = randomString(15)
    await authReq('put', '/api/entities?action=update-label', { id, lang: 'fr', value })
    const updatedHuman = await getByUri(uri)
    updatedHuman.labels.fr.should.equal(value)
  })

  it('should update a label', async () => {
    const { _id, uri } = await humanPromise
    const value = randomString(15)
    await updateLabel(_id, 'fr', value)
    const updatedHuman = await getByUri(uri)
    updatedHuman.labels.fr.should.equal(value)
  })

  it('should trim a label', async () => {
    const trimValue = randomString(15)
    const trimValueLength = trimValue.length
    const value = `${trimValue}     `
    const { _id, uri } = await humanPromise
    await updateLabel(_id, 'fr', value)
    const updatedHuman = await getByUri(uri)
    updatedHuman.labels.fr.length.should.equal(trimValueLength)
  })

  it('should reject an update with an invalid lang', async () => {
    const value = randomString(15)
    const { _id } = await humanPromise
    try {
      await updateLabel(_id, 'zz', value).then(shouldNotBeCalled)
    } catch (err) {
      rethrowShouldNotBeCalledErrors(err)
      err.statusCode.should.equal(400)
      err.body.status_verbose.should.startWith('invalid lang')
    }
  })

  it('should reject an update with an invalid value', async () => {
    const { _id } = await humanPromise
    try {
      await updateLabel(_id, 'en', 123).then(shouldNotBeCalled)
    } catch (err) {
      rethrowShouldNotBeCalledErrors(err)
      err.statusCode.should.equal(400)
      err.body.status_verbose.should.startWith('invalid value')
    }
  })

  it('should reject an update with an empty string', async () => {
    const { _id } = await humanPromise
    try {
      await updateLabel(_id, 'en', '').then(shouldNotBeCalled)
    } catch (err) {
      rethrowShouldNotBeCalledErrors(err)
      err.statusCode.should.equal(400)
      err.body.status_verbose.should.startWith('invalid value')
    }
  })

  it('should reject an up-to-date value', async () => {
    const value = randomString(15)
    const { _id } = await humanPromise
    await updateLabel(_id, 'en', value)
    try {
      await updateLabel(_id, 'en', value).then(shouldNotBeCalled)
    } catch (err) {
      rethrowShouldNotBeCalledErrors(err)
      err.statusCode.should.equal(400)
      err.body.status_verbose.should.startWith('already up-to-date')
    }
  })

  it('should accept rapid updates on the same entity', async () => {
    const name = 'Georges'
    const langs = [ 'en', 'fr' ]
    const { _id, uri } = await humanPromise
    const responses = await Promise.all(langs.map(lang => updateLabel(_id, lang, name)))
    responses.forEach(res => should(res.ok).be.true())
    const updatedHuman = await getByUri(uri)
    langs.forEach(lang => updatedHuman.labels[lang].should.equal(name))
  })
})
