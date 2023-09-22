import 'should'
import { shouldNotBeCalled } from '#tests/unit/utils'
import { createHuman, someOpenLibraryId, someFakeUri } from '../fixtures/entities.js'
import { addClaim, updateClaim } from '../utils/entities.js'

// For the internals, see ./add_update_remove_claim.test.js
describe('entities:update-claim interface', () => {
  it('should reject without uri', async () => {
    await updateClaim({ property: 'wdt:P123' })
    .then(shouldNotBeCalled)
    .catch(err => {
      err.body.status_verbose.should.equal('missing parameter in body: uri')
      err.statusCode.should.equal(400)
    })
  })

  it('should reject without property', async () => {
    await updateClaim({ uri: someFakeUri })
    .then(shouldNotBeCalled)
    .catch(err => {
      err.body.status_verbose.should.equal('missing parameter in body: property')
      err.statusCode.should.equal(400)
    })
  })

  it('should reject without old-value', async () => {
    const property = 'wdt:P1104'
    await updateClaim({ uri: someFakeUri, property, newValue: 125 })
    .then(shouldNotBeCalled)
    .catch(err => {
      err.body.status_verbose.should.equal('missing parameter in body: old-value')
      err.statusCode.should.equal(400)
    })
  })

  it('should reject without new-value', async () => {
    const property = 'wdt:P1104'
    await updateClaim({ uri: someFakeUri, property, oldValue: 213 })
    .then(shouldNotBeCalled)
    .catch(err => {
      err.body.status_verbose.should.equal('missing parameter in body: new-value')
      err.statusCode.should.equal(400)
    })
  })

  it('should reject invalid uri prefix', async () => {
    const uri = 'invalidprefix:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
    const property = 'wdt:P1104'
    await updateClaim({ uri, property, oldValue: 1312 })
    .then(shouldNotBeCalled)
    .catch(err => {
      err.body.status_verbose.should.startWith('invalid uri')
      err.statusCode.should.equal(400)
    })
  })

  it('should update a claim', async () => {
    const openlibraryIdA = someOpenLibraryId()
    const openlibraryIdB = someOpenLibraryId()
    const human = await createHuman()
    await addClaim({ uri: human.uri, property: 'wdt:P648', value: openlibraryIdA })
    await updateClaim({ uri: human.uri, property: 'wdt:P648', oldValue: openlibraryIdA, newValue: openlibraryIdB })
  })
})
