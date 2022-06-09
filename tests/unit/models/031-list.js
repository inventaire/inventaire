const _ = require('builders/utils')
const { expired } = require('lib/time')
const List = require('models/list')
const { shouldNotBeCalled } = require('../utils')
require('should')

const someUserId = '1234567890a1234567890b1234567890'
const { create, updateAttributes: update } = List

const fakeText = require('tests/api/fixtures/text')
const fakeName = fakeText.randomWords(4)
const fakeDesc = fakeText.randomWords(15)

const validList = {
  creator: someUserId,
  description: fakeDesc,
  visibility: [],
  name: fakeName
}

const extendList = data => Object.assign({}, validList, data)

describe('list model', () => {
  describe('create', () => {
    it('should return an object', () => {
      const list = create(validList)
      list.should.be.an.Object()
      list.name.should.equal(fakeName)
      list.description.should.equal(fakeDesc)
      list.creator.should.equal(someUserId)
      list.visibility.should.deepEqual([])
      list.created.should.be.a.Number()
    })

    it('should throw when passed an invalid attributes', () => {
      const list = extendList({ authors: 'Abel Paz' })
      const creator = () => List.create(list)
      creator.should.throw()
    })

    describe('mandatory attributes', () => {
      it('should throw on missing creator', () => {
        const invalidList = _.cloneDeep(validList)
        delete invalidList.creator
        const creator = () => List.create(invalidList)
        creator.should.throw()
      })

      it('should throw on missing name', () => {
        const invalidList = _.cloneDeep(validList)
        delete invalidList.name
        const creator = () => List.create(invalidList)
        creator.should.throw()
      })
    })

    describe('visibility', () => {
      it('should use a default visibility value', () => {
        const list = create(extendList({ visibility: null }))
        list.visibility.should.deepEqual([])
      })

      it('should reject a bad visibility value', () => {
        const list = (extendList({ visibility: [ 'notalist' ] }))
        try {
          const res = create(list)
          shouldNotBeCalled(res)
        } catch (err) {
          err.message.should.startWith('invalid visibility')
        }
      })
    })

    describe('creator', () => {
      it('should return an object with an creator', () => {
        const list = create(validList)
        list.creator.should.equal(someUserId)
      })
    })

    describe('created', () => {
      it('should return an object with a created time', () => {
        const list = create(validList)
        expired(list.created, 100).should.be.false()
      })
    })
  })

  describe('update', () => {
    it('should update when passing a valid attribute', () => {
      const list = create(validList)
      const updateAttributesData = { visibility: [ 'public' ] }
      const res = update(list, updateAttributesData, someUserId)
      res.visibility.should.deepEqual([ 'public' ])
    })

    it('should throw when passing an invalid attribute', () => {
      const doc = create(validList)
      const updateAttributesData = { foo: '123' }
      const updater = () => update(doc, updateAttributesData, someUserId)
      updater.should.throw('invalid attribute: foo')
    })

    it('should throw when passing an invalid attribute value', () => {
      const doc = create(validList)
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
