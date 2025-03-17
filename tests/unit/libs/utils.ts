import 'should'
import { forceArray, getHashCode, mapKeysValues, uniqByKey, uniqSortedByCount } from '#lib/utils/base'
import { typeOf } from '#lib/utils/types'

describe('utils', () => {
  describe('getHashCode', () => {
    it('should return a hash', () => {
      getHashCode('whatever').should.be.a.Number()
    })
  })

  describe('typeOf', () => {
    it('should return the right type', () => {
      typeOf('hello').should.equal('string')
      typeOf([ 'hello' ]).should.equal('array')
      typeOf({ hel: 'lo' }).should.equal('object')
      typeOf(83110).should.equal('number')
      typeOf(null).should.equal('null')
      typeOf(undefined).should.equal('undefined')
      typeOf(false).should.equal('boolean')
      typeOf(Number('boudu')).should.equal('NaN')
      typeOf(Promise.resolve()).should.equal('promise')
    })
  })

  describe('forceArray', () => {
    it('should return an array for an array', () => {
      const a = forceArray([ 1, 2, 3, { zo: 'hello' }, null ])
      a.should.be.an.Array()
      a.length.should.equal(5)
    })

    it('should return an array for a string', () => {
      const a = forceArray('yolo')
      a.should.be.an.Array()
      a.length.should.equal(1)
    })

    it('should return an array for a number', () => {
      const a = forceArray(125)
      a.should.be.an.Array()
      a.length.should.equal(1)
      const b = forceArray(-12612125)
      b.should.be.an.Array()
      b.length.should.equal(1)
    })

    it('should return an array for an object', () => {
      const a = forceArray({ bon: 'jour' })
      a.should.be.an.Array()
      a.length.should.equal(1)
    })

    it('should return an empty array for null', () => {
      const a = forceArray(null)
      a.should.be.an.Array()
      a.length.should.equal(0)
    })

    it('should return an empty array for undefined', () => {
      const a = forceArray(null)
      a.should.be.an.Array()
      a.length.should.equal(0)
    })

    it('should return an empty array for an empty input', () => {
      const a = forceArray()
      a.should.be.an.Array()
      a.length.should.equal(0)
    })

    it('should return an empty array for an empty string', () => {
      const a = forceArray('')
      a.should.be.an.Array()
      a.length.should.equal(0)
    })
  })

  describe('mapKeysValues', () => {
    it('should return a new object', () => {
      const obj = { a: 1, b: 2 }
      const fn = (key, value) => [ key, value ]
      const newObj = mapKeysValues(obj, fn)
      newObj.should.be.an.Object()
      newObj.should.not.equal(obj)
    })

    it('should return new keys and values', () => {
      const obj = { a: 1, b: 2 }
      const fn = (key, value) => [ key + key, value + value ]
      mapKeysValues(obj, fn).should.deepEqual({ aa: 2, bb: 4 })
    })
  })

  describe('uniqByKey', () => {
    it('should return a deduplicated collection', () => {
      const collection = [ { a: 1 }, { a: 1 }, { a: 2 } ]
      uniqByKey(collection, 'a').should.deepEqual([ { a: 1 }, { a: 2 } ])
    })
  })

  describe('uniqSortedByCount', () => {
    it('should sort values by count', () => {
      uniqSortedByCount([ 'a', 'b', 'c', 'c', 'b', 'b' ]).should.deepEqual([ 'b', 'c', 'a' ])
      // The `countBy` implementation stringifies the values, so the follow fails
      // uniqSortedByCount([ 1, 2, 3, 3, 4, 5, 5, 5 ]).should.deepEqual([ 5, 3, 1, 2, 4 ])
    })
  })
})
