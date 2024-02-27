import 'should'
import { cloneDeep } from 'lodash-es'
import { randomWords } from '#fixtures/text'
import { expired } from '#lib/time'
import { createShelfDoc, updateShelfDocAttributes } from '#models/shelf'
import { shouldNotBeCalled } from '#tests/unit/utils'

const someUserId = '1234567890a1234567890b1234567890'
const fakeName = randomWords(4)
const fakeDesc = randomWords(15)

const validShelf = {
  owner: someUserId,
  description: fakeDesc,
  visibility: [],
  name: fakeName,
}

const extendShelf = data => Object.assign({}, validShelf, data)

describe('shelf model', () => {
  describe('createShelfDoc', () => {
    it('should return an object', () => {
      const shelf = createShelfDoc(validShelf)
      shelf.should.be.an.Object()
      shelf.name.should.equal(fakeName)
      shelf.description.should.equal(fakeDesc)
      shelf.owner.should.equal(someUserId)
      shelf.visibility.should.deepEqual([])
      shelf.created.should.be.a.Number()
    })

    it('should throw when passed an invalid attributes', () => {
      const shelf = extendShelf({ authors: 'Abel Paz' })
      const creator = () => createShelfDoc(shelf)
      creator.should.throw()
    })

    describe('mandatory attributes', () => {
      it('should throw on missing owner', () => {
        const invalidShelf = cloneDeep(validShelf)
        delete invalidShelf.owner
        const creator = () => createShelfDoc(invalidShelf)
        creator.should.throw()
      })

      it('should throw on missing name', () => {
        const invalidShelf = cloneDeep(validShelf)
        delete invalidShelf.name
        const creator = () => createShelfDoc(invalidShelf)
        creator.should.throw()
      })
    })

    describe('visibility', () => {
      it('should use a default visibility value', () => {
        const shelf = createShelfDoc(extendShelf({ visibility: null }))
        shelf.visibility.should.deepEqual([])
      })

      it('should reject a bad visibility value', () => {
        const shelf = (extendShelf({ visibility: [ 'notalist' ] }))
        try {
          const res = createShelfDoc(shelf)
          shouldNotBeCalled(res)
        } catch (err) {
          err.message.should.startWith('invalid visibility')
        }
      })
    })

    describe('owner', () => {
      it('should return an object with an owner', () => {
        const shelf = createShelfDoc(validShelf)
        shelf.owner.should.equal(someUserId)
      })
    })

    describe('created', () => {
      it('should return an object with a created time', () => {
        const shelf = createShelfDoc(validShelf)
        expired(shelf.created, 100).should.be.false()
      })
    })
  })

  describe('updateShelfDocAttributes', () => {
    it('should update when passing a valid attribute', () => {
      const shelf = createShelfDoc(validShelf)
      const updateAttributesData = { visibility: [ 'public' ] }
      const res = updateShelfDocAttributes(shelf, updateAttributesData, someUserId)
      res.visibility.should.deepEqual([ 'public' ])
    })

    it('should throw when passing an invalid attribute', () => {
      const doc = createShelfDoc(validShelf)
      const updateAttributesData = { foo: '123' }
      const updater = () => updateShelfDocAttributes(doc, updateAttributesData, someUserId)
      updater.should.throw('invalid attribute: foo')
    })

    it('should throw when passing an invalid attribute value', () => {
      const doc = createShelfDoc(validShelf)
      const updateAttributesData = { visibility: [ 'kikken' ] }
      try {
        const res = updateShelfDocAttributes(doc, updateAttributesData, someUserId)
        shouldNotBeCalled(res)
      } catch (err) {
        err.message.should.startWith('invalid visibility')
      }
    })
  })
})
