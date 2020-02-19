const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')
const Shelf = __.require('models', 'shelf')

const someUserId = '1234567890a1234567890b1234567890'
const create = Shelf.create.bind(null)

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

    it('should throw without an owner', done => {
      const invalidShelf = _.cloneDeep(validShelf)
      delete invalidShelf.owner
      const creator = () => Shelf.create(invalidShelf)
      creator.should.throw()
      done()
    })
  })
})
