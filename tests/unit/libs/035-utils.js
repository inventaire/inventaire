const __ = require('config').universalPath
const _ = require('builders/utils')
require('should')

describe('utils', () => {
  describe('env', () => {
    it('should have loggers, boolean validations, and misc utils', () => {
      _.Log.should.be.a.Function()
      _.isLocalImg.should.be.a.Function()
      _.hashCode.should.be.a.Function()
    })
  })

  describe('hashCode', () => {
    it('should return a hash', () => {
      _.hashCode('whatever').should.be.a.Number()
    })
  })

  describe('buildPath', () => {
    it('should return a string with parameters', () => {
      const path = _.buildPath('/api', { action: 'man' })
      path.should.be.a.String()
      path.should.equal('/api?action=man')
    })

    it('should not add empty parameters', () => {
      const path = _.buildPath('/api', { action: 'man', boudu: null })
      path.should.equal('/api?action=man')
    })

    it('should stringify object value', () => {
      const path = _.buildPath('/api', { action: 'man', data: { a: [ 'abc', 2 ] } })
      path.should.equal('/api?action=man&data={"a":["abc",2]}')
    })

    it('should URI encode object values problematic query string characters', () => {
      const data = { a: 'some string with ?!MM%** problematic characters' }
      const path = _.buildPath('/api', { data })
      path.should.equal('/api?data={"a":"some string with %3F!MM%** problematic characters"}')
    })
  })

  describe('typeOf', () => {
    it('should return the right type', () => {
      _.typeOf('hello').should.equal('string')
      _.typeOf([ 'hello' ]).should.equal('array')
      _.typeOf({ hel: 'lo' }).should.equal('object')
      _.typeOf(83110).should.equal('number')
      _.typeOf(null).should.equal('null')
      _.typeOf().should.equal('undefined')
      _.typeOf(false).should.equal('boolean')
      _.typeOf(Number('boudu')).should.equal('NaN')
      _.typeOf(Promise.resolve()).should.equal('promise')
    })
  })

  describe('forceArray', () => {
    it('should return an array for an array', () => {
      const a = _.forceArray([ 1, 2, 3, { zo: 'hello' }, null ])
      a.should.be.an.Array()
      a.length.should.equal(5)
    })

    it('should return an array for a string', () => {
      const a = _.forceArray('yolo')
      a.should.be.an.Array()
      a.length.should.equal(1)
    })

    it('should return an array for a number', () => {
      const a = _.forceArray(125)
      a.should.be.an.Array()
      a.length.should.equal(1)
      const b = _.forceArray(-12612125)
      b.should.be.an.Array()
      b.length.should.equal(1)
    })

    it('should return an array for an object', () => {
      const a = _.forceArray({ bon: 'jour' })
      a.should.be.an.Array()
      a.length.should.equal(1)
    })

    it('should return an empty array for null', () => {
      const a = _.forceArray(null)
      a.should.be.an.Array()
      a.length.should.equal(0)
    })

    it('should return an empty array for undefined', () => {
      const a = _.forceArray(null)
      a.should.be.an.Array()
      a.length.should.equal(0)
    })

    it('should return an empty array for an empty input', () => {
      const a = _.forceArray()
      a.should.be.an.Array()
      a.length.should.equal(0)
    })

    it('should return an empty array for an empty string', () => {
      const a = _.forceArray('')
      a.should.be.an.Array()
      a.length.should.equal(0)
    })
  })

  describe('mapKeysValues', () => {
    it('should return a new object', () => {
      const obj = { a: 1, b: 2 }
      const fn = (key, value) => [ key, value ]
      const newObj = _.mapKeysValues(obj, fn)
      newObj.should.be.an.Object()
      newObj.should.not.equal(obj)
    })

    it('should return new keys and values', () => {
      const obj = { a: 1, b: 2 }
      const fn = (key, value) => [ key + key, value + value ]
      _.mapKeysValues(obj, fn).should.deepEqual({ aa: 2, bb: 4 })
    })
  })
})
