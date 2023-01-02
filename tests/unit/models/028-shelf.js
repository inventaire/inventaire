import 'should'
import _ from '#builders/utils'
import { expired } from '#lib/time'
import Shelf from '#models/shelf'
import fakeText from '#tests/api/fixtures/text'
import { shouldNotBeCalled } from '../utils.js'

const someUserId = '1234567890a1234567890b1234567890'
const { create, updateAttributes: update } = Shelf
const fakeName = fakeText.randomWords(4)
const fakeDesc = fakeText.randomWords(15)

const validShelf = {
  owner: someUserId,
  description: fakeDesc,
  visibility: [],
  name: fakeName,
}

const extendShelf = data => Object.assign({}, validShelf, data)

describe('shelf model', () => {
  describe('create', () => {
    it('should return an object', () => {
      const shelf = create(validShelf)
      shelf.should.be.an.Object()
      shelf.name.should.equal(fakeName)
      shelf.description.should.equal(fakeDesc)
      shelf.owner.should.equal(someUserId)
      shelf.visibility.should.deepEqual([])
      shelf.created.should.be.a.Number()
    })

    it('should throw when passed an invalid attributes', () => {
      const shelf = extendShelf({ authors: 'Abel Paz' })
      const creator = () => Shelf.create(shelf)
      creator.should.throw()
    })

    describe('mandatory attributes', () => {
      it('should throw on missing owner', () => {
        const invalidShelf = _.cloneDeep(validShelf)
        delete invalidShelf.owner
        const creator = () => Shelf.create(invalidShelf)
        creator.should.throw()
      })

      it('should throw on missing name', () => {
        const invalidShelf = _.cloneDeep(validShelf)
        delete invalidShelf.name
        const creator = () => Shelf.create(invalidShelf)
        creator.should.throw()
      })
    })

    describe('visibility', () => {
      it('should use a default visibility value', () => {
        const shelf = create(extendShelf({ visibility: null }))
        shelf.visibility.should.deepEqual([])
      })

      it('should reject a bad visibility value', () => {
        const shelf = (extendShelf({ visibility: [ 'notalist' ] }))
        try {
          const res = create(shelf)
          shouldNotBeCalled(res)
        } catch (err) {
          err.message.should.startWith('invalid visibility')
        }
      })
    })

    describe('owner', () => {
      it('should return an object with an owner', () => {
        const shelf = create(validShelf)
        shelf.owner.should.equal(someUserId)
      })
    })

    describe('created', () => {
      it('should return an object with a created time', () => {
        const shelf = create(validShelf)
        expired(shelf.created, 100).should.be.false()
      })
    })
  })

  describe('update', () => {
    it('should update when passing a valid attribute', () => {
      const shelf = create(validShelf)
      const updateAttributesData = { visibility: [ 'public' ] }
      const res = update(shelf, updateAttributesData, someUserId)
      res.visibility.should.deepEqual([ 'public' ])
    })

    it('should throw when passing an invalid attribute', () => {
      const doc = create(validShelf)
      const updateAttributesData = { foo: '123' }
      const updater = () => update(doc, updateAttributesData, someUserId)
      updater.should.throw('invalid attribute: foo')
    })

    it('should throw when passing an invalid attribute value', () => {
      const doc = create(validShelf)
      const updateAttributesData = { visibility: [ 'kikken' ] }
      try {
        const res = update(doc, updateAttributesData, someUserId)
        shouldNotBeCalled(res)
      } catch (err) {
        err.message.should.startWith('invalid visibility')
      }
    })
  })
})
