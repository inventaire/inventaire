import should from 'should'
import { getRandomString } from '#lib/utils/random_string'
import { shouldNotBeCalled, rethrowShouldNotBeCalledErrors } from '#tests/unit/utils'
import { createHuman } from '../fixtures/entities.js'
import { getByUri, updateLabel } from '../utils/entities.js'
import { authReq } from '../utils/utils.js'

const humanPromise = createHuman()

describe('entities:update-labels:inv', () => {
  it('should reject without value', async () => {
    const { _id } = await humanPromise
    try {
      await updateLabel({ uri: _id, lang: 'fr' }).then(shouldNotBeCalled)
    } catch (err) {
      rethrowShouldNotBeCalledErrors(err)
      err.body.status_verbose.should.equal('missing parameter in body: value')
      err.statusCode.should.equal(400)
    }
  })

  it('should update without lang parameter, english as default', async () => {
    const { uri } = await humanPromise
    const value = getRandomString(15)
    await authReq('put', '/api/entities?action=update-label', { uri, value })
    const updatedHuman = await getByUri(uri)
    updatedHuman.labels.en.should.equal(value)
  })

  it('should accept an entity id instead of uri', async () => {
    const { _id: id, uri } = await humanPromise
    const value = getRandomString(15)
    await authReq('put', '/api/entities?action=update-label', { id, lang: 'fr', value })
    const updatedHuman = await getByUri(uri)
    updatedHuman.labels.fr.should.equal(value)
  })

  it('should update a label', async () => {
    const { _id, uri } = await humanPromise
    const value = getRandomString(15)
    await updateLabel({ uri: _id, lang: 'fr', value })
    const updatedHuman = await getByUri(uri)
    updatedHuman.labels.fr.should.equal(value)
  })

  it('should trim a label', async () => {
    const trimValue = getRandomString(15)
    const trimValueLength = trimValue.length
    const value = `${trimValue}     `
    const { _id, uri } = await humanPromise
    await updateLabel({ uri: _id, lang: 'fr', value })
    const updatedHuman = await getByUri(uri)
    updatedHuman.labels.fr.length.should.equal(trimValueLength)
  })

  it('should reject an update with an invalid lang', async () => {
    const value = getRandomString(15)
    const { _id } = await humanPromise
    try {
      await updateLabel({ uri: _id, lang: 'zz', value }).then(shouldNotBeCalled)
    } catch (err) {
      rethrowShouldNotBeCalledErrors(err)
      err.statusCode.should.equal(400)
      err.body.status_verbose.should.startWith('invalid lang')
    }
  })

  it('should reject an update with an invalid value', async () => {
    const { _id } = await humanPromise
    try {
      await updateLabel({ uri: _id, lang: 'en', value: 123 }).then(shouldNotBeCalled)
    } catch (err) {
      rethrowShouldNotBeCalledErrors(err)
      err.statusCode.should.equal(400)
      err.body.status_verbose.should.startWith('invalid value')
    }
  })

  it('should reject an update with an empty string', async () => {
    const { _id } = await humanPromise
    try {
      await updateLabel({ uri: _id, lang: 'en', value: '' }).then(shouldNotBeCalled)
    } catch (err) {
      rethrowShouldNotBeCalledErrors(err)
      err.statusCode.should.equal(400)
      err.body.status_verbose.should.startWith('invalid value')
    }
  })

  it('should reject an up-to-date value', async () => {
    const value = getRandomString(15)
    const { _id } = await humanPromise
    await updateLabel({ uri: _id, lang: 'en', value })
    try {
      await updateLabel({ uri: _id, lang: 'en', value }).then(shouldNotBeCalled)
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
    const responses = await Promise.all(langs.map(lang => updateLabel({ uri: _id, lang, value: name })))
    responses.forEach(res => should(res.ok).be.true())
    const updatedHuman = await getByUri(uri)
    langs.forEach(lang => updatedHuman.labels[lang].should.equal(name))
  })
})
