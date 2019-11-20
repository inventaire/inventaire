
const __ = require('config').universalPath
const _ = __.require('builders', 'utils')
require('should')

describe('utils', () => {
  describe('env', () => it('should have loggers, boolean validations, and misc utils', done => {
    _.Log.should.be.a.Function()
    _.isLocalImg.should.be.a.Function()
    _.hashCode.should.be.a.Function()
    done()
  }))

  describe('hashCode', () => it('should return a hash', done => {
    _.hashCode('whatever').should.be.a.Number()
    done()
  }))

  describe('flattenIndexes', () => {
    it('should return the collection of indexes merged into one', done => {
      _.flattenIndexes.should.be.a.Function()
      const indexes = [ { a: 1 }, { b: 2 }, { c: 3 }, { a: 4, d: 5 } ]
      const result = _.flattenIndexes(indexes)
      result.should.be.an.Object()
      result.a.should.equal(4)
      result.b.should.equal(2)
      result.c.should.equal(3)
      result.d.should.equal(5)
      Object.keys(result).length.should.equal(4)
      done()
    })

    it('should return a new index without modifiy the passed indexes', done => {
      const indexA = { a: 1 }
      const indexB = { b: 2 }
      const indexC = { c: 3 }
      const indexD = { a: 4, d: 5 }
      const indexes = [ indexA, indexB, indexC, indexD ]
      const result = _.flattenIndexes(indexes)
      result.should.not.equal(indexA)
      result.should.not.equal(indexB)
      result.should.not.equal(indexC)
      result.should.not.equal(indexD)
      done()
    })
  })

  describe('buildPath', () => {
    it('should return a string with parameters', done => {
      const path = _.buildPath('/api', { action: 'man' })
      path.should.be.a.String()
      path.should.equal('/api?action=man')
      done()
    })

    it('should not add empty parameters', done => {
      const path = _.buildPath('/api', { action: 'man', boudu: null })
      path.should.equal('/api?action=man')
      done()
    })

    it('should stringify object value', done => {
      const path = _.buildPath('/api', { action: 'man', data: { a: [ 'abc', 2 ] } })
      path.should.equal('/api?action=man&data={"a":["abc",2]}')
      done()
    })

    it('should URI encode object values problematic query string characters', done => {
      const data = { a: 'some string with ?!MM%** problematic characters' }
      const path = _.buildPath('/api', { data })
      path.should.equal('/api?data={"a":"some string with %3F!MM%** problematic characters"}')
      done()
    })
  })

  describe('typeOf', () => it('should return the right type', done => {
    _.typeOf('hello').should.equal('string')
    _.typeOf([ 'hello' ]).should.equal('array')
    _.typeOf({ hel: 'lo' }).should.equal('object')
    _.typeOf(83110).should.equal('number')
    _.typeOf(null).should.equal('null')
    _.typeOf().should.equal('undefined')
    _.typeOf(false).should.equal('boolean')
    _.typeOf(Number('boudu')).should.equal('NaN')
    done()
  }))

  describe('forceArray', done => {
    it('should return an array for an array', done => {
      const a = _.forceArray([ 1, 2, 3, { zo: 'hello' }, null ])
      a.should.be.an.Array()
      a.length.should.equal(5)
      done()
    })

    it('should return an array for a string', done => {
      const a = _.forceArray('yolo')
      a.should.be.an.Array()
      a.length.should.equal(1)
      done()
    })

    it('should return an array for a number', done => {
      const a = _.forceArray(125)
      a.should.be.an.Array()
      a.length.should.equal(1)
      const b = _.forceArray(-12612125)
      b.should.be.an.Array()
      b.length.should.equal(1)
      done()
    })

    it('should return an array for an object', done => {
      const a = _.forceArray({ bon: 'jour' })
      a.should.be.an.Array()
      a.length.should.equal(1)
      done()
    })

    it('should return an empty array for null', done => {
      const a = _.forceArray(null)
      a.should.be.an.Array()
      a.length.should.equal(0)
      done()
    })

    it('should return an empty array for undefined', done => {
      const a = _.forceArray(null)
      a.should.be.an.Array()
      a.length.should.equal(0)
      done()
    })

    it('should return an empty array for an empty input', done => {
      const a = _.forceArray()
      a.should.be.an.Array()
      a.length.should.equal(0)
      done()
    })

    it('should return an empty array for an empty string', done => {
      const a = _.forceArray('')
      a.should.be.an.Array()
      a.length.should.equal(0)
      done()
    })
  })

  describe('mapKeysValues', () => {
    it('should return a new object', done => {
      const obj = { a: 1, b: 2 }
      const fn = (key, value) => [ key, value ]
      const newObj = _.mapKeysValues(obj, fn)
      newObj.should.be.an.Object()
      newObj.should.not.equal(obj)
      done()
    })

    it('should return new keys and values', done => {
      const obj = { a: 1, b: 2 }
      const fn = (key, value) => [ key + key, value + value ]
      _.mapKeysValues(obj, fn).should.deepEqual({ aa: 2, bb: 4 })
      done()
    })
  })
})
