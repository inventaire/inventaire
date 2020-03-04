const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')
const Shelf = __.require('models', 'shelf')
require('should')

const someUserId = '1234567890a1234567890b1234567890'
const create = Shelf.create.bind(null)
const update = Shelf.updateAttributes.bind(null)

const faker = require('faker')
const fakeName = faker.random.words(4)
const fakeDesc = faker.random.words(15)

const validShelf = {
  owner: someUserId,
  description: fakeDesc,
  listing: 'private',
  name: fakeName
}

const extendShelf = data => Object.assign({}, validShelf, data)

describe('shelf model', () => {
  describe('create', () => {
    it('should return an object', done => {
      const shelf = create(validShelf)
      shelf.should.be.an.Object()
      shelf.name.should.equal(fakeName)
      shelf.description.should.equal(fakeDesc)
      shelf.owner.should.equal(someUserId)
      shelf.listing.should.equal('private')
      shelf.created.should.be.a.Number()
      done()
    })

    it('should throw when passed an invalid attributes', done => {
      const shelf = extendShelf({ authors: 'Abel Paz' })
      const creator = () => Shelf.create(shelf)
      creator.should.throw()
      done()
    })

    describe('mandatory attributes', () => {
      it('should throw on missing owner', done => {
        const invalidShelf = _.cloneDeep(validShelf)
        delete invalidShelf.owner
        const creator = () => Shelf.create(invalidShelf)
        creator.should.throw()
        done()
      })

      it('should throw on missing name', done => {
        const invalidShelf = _.cloneDeep(validShelf)
        delete invalidShelf.name
        const creator = () => Shelf.create(invalidShelf)
        creator.should.throw()
        done()
      })
    })

    describe('listing', () => {
      it('should use a default listing value', done => {
        const shelf = create(extendShelf({ listing: null }))
        shelf.listing.should.equal('private')
        done()
      })

      it('should override a bad listing with default value', done => {
        const shelf = create(extendShelf({ listing: 'evillist' }))
        shelf.listing.should.equal('private')
        done()
      })
    })

    describe('owner', () => {
      it('should return an object with an owner', done => {
        const shelf = create(validShelf)
        shelf.owner.should.equal(someUserId)
        done()
      })
    })

    describe('created', () => {
      it('should return an object with a created time', done => {
        const shelf = create(validShelf)
        _.expired(shelf.created, 100).should.be.false()
        done()
      })
    })
  })

  describe('update', () => {
    it('should update when passing a valid attribute', done => {
      const shelf = create(validShelf)
      const updateAttributesData = { listing: 'public' }
      const res = update(someUserId, updateAttributesData)(shelf)
      res.listing.should.equal('public')
      done()
    })

    it('should throw when passing an invalid attribute', done => {
      const doc = create(validShelf)
      const updateAttributesData = { foo: '123' }
      const updater = () => update(someUserId, updateAttributesData)(doc)
      updater.should.throw('invalid attribute: foo')
      done()
    })

    it('should throw when passing an invalid attribute value', done => {
      const doc = create(validShelf)
      const updateAttributesData = { listing: 'kikken' }
      const updater = () => update(someUserId, updateAttributesData)(doc)
      updater.should.throw('invalid listing: kikken')
      done()
    })
  })
})
