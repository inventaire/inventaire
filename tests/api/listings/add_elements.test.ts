import { map, uniq } from 'lodash-es'
import { getByIdWithElements } from '#tests/api/utils/listings'
import { getUserB } from '#tests/api/utils/utils'
import { shouldNotBeCalled, rethrowShouldNotBeCalledErrors } from '#tests/unit/utils/utils'
import { createEdition, someFakeUri } from '../fixtures/entities.js'
import { createListing, createElement } from '../fixtures/listings.js'
import { authReq } from '../utils/utils.js'

const endpoint = '/api/lists?action='

describe('listings:add-elements', () => {
  it('should reject without listing id', async () => {
    try {
      await authReq('post', `${endpoint}add-elements`).then(shouldNotBeCalled)
    } catch (err) {
      rethrowShouldNotBeCalledErrors(err)
      err.body.status_verbose.should.equal('missing parameter in body: id')
      err.statusCode.should.equal(400)
    }
  })

  it('should reject without uri', async () => {
    const { listing } = await createListing()
    try {
      await authReq('post', `${endpoint}add-elements`, {
        id: listing._id,
      })
      .then(shouldNotBeCalled)
    } catch (err) {
      rethrowShouldNotBeCalledErrors(err)
      err.body.status_verbose.should.equal('missing parameter in body: uris')
      err.statusCode.should.equal(400)
    }
  })

  it('should reject creating an element with an unknown entity', async () => {
    const { listing } = await createListing()
    await authReq('post', `${endpoint}add-elements`, {
      id: listing._id,
      uris: [ someFakeUri ],
    })
    .then(shouldNotBeCalled)
    .catch(err => {
      err.statusCode.should.equal(403)
      err.body.status_verbose.should.equal('entities not found')
    })
    const updatedListing = await getByIdWithElements({ id: listing._id })
    updatedListing.elements.length.should.equal(0)
  })

  it('should add uri and create element', async () => {
    const { listing } = await createListing()
    const { uri } = await createEdition()
    await authReq('post', `${endpoint}add-elements`, {
      id: listing._id,
      uris: [ uri ],
    })
    const { uri: uri2 } = await createEdition()
    await authReq('post', `${endpoint}add-elements`, {
      id: listing._id,
      uris: [ uri2 ],
    })
    const updatedListing = await getByIdWithElements({ id: listing._id })
    updatedListing.elements[1].ordinal.should.equal('2')
  })

  it('should give different ordinals to multiple elements created at the same time', async () => {
    const { listing } = await createListing()
    const editions = await Promise.all([
      createEdition(),
      createEdition(),
      createEdition(),
      createEdition(),
    ])
    const uris = map(editions, 'uri')
    await authReq('post', `${endpoint}add-elements`, {
      id: listing._id,
      uris: uris.slice(0, 2),
    })
    await authReq('post', `${endpoint}add-elements`, {
      id: listing._id,
      uris: uris.slice(2, 4),
    })
    const { elements } = await getByIdWithElements({ id: listing._id })
    const ordinals = map(elements, 'ordinal')
    uniq(ordinals).length.should.equal(uris.length)
  })

  it('should not add twice an element already in listing', async () => {
    const { listing, uri } = await createElement({})

    const res = await authReq('post', `${endpoint}add-elements`, {
      id: listing._id,
      uris: [ uri ],
    })
    res.ok.should.be.true()
    res.alreadyInList[0].uri.should.equal(uri)

    const updatedListing = await getByIdWithElements({ id: listing._id })
    updatedListing.elements.length.should.equal(1)
    updatedListing.elements[0].uri.should.equal(uri)
  })

  it('should reject adding an element to a listing of another creator', async () => {
    try {
      const { listing } = await createListing(getUserB())
      const { uri } = await createEdition()
      await authReq('post', `${endpoint}add-elements`, {
        id: listing._id,
        uris: [ uri ],
      })
      .then(shouldNotBeCalled)
    } catch (err) {
      rethrowShouldNotBeCalledErrors(err)
      err.body.status_verbose.should.startWith('wrong user')
      err.statusCode.should.equal(403)
    }
  })
})
