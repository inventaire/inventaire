const CONFIG = require('config')
const __ = CONFIG.universalPath

require('should')
const memoize = require('lib/utils/memoize')

describe('memoize', () => {
  it('should be a function', () => {
    memoize.should.be.a.Function()
  })

  it('should cache values per key', () => {
    let callCount = 0
    const fn = key => {
      callCount++
      return { foo: key }
    }
    const memoizedFn = memoize(fn)
    const objA = memoizedFn('foo')
    const objB = memoizedFn('foo')
    objA.should.equal(objB)
    callCount.should.equal(1)
  })

  it('should not mix values', () => {
    let callCount = 0
    const fn = key => {
      callCount++
      return { foo: key }
    }
    const memoizedFn = memoize(fn)
    const objA = memoizedFn('foo')
    const objB = memoizedFn('bar')
    objA.should.not.equal(objB)
    callCount.should.equal(2)
  })

  it('should accept multiple keys', () => {
    let callCount = 0
    const fn = (a, b) => {
      callCount++
      return { foo: a + b }
    }
    const memoizedFn = memoize(fn)
    const objA = memoizedFn('foo')
    const objB = memoizedFn('foo', 'oof')
    const objC = memoizedFn('foo', 'oof')
    objA.should.not.equal(objB)
    objB.should.equal(objC)
    callCount.should.equal(2)
  })

  it('should tolerate undefined keys', () => {
    let callCount = 0
    const fn = (a, b) => {
      callCount++
      return { foo: a + b }
    }
    const memoizedFn = memoize(fn)
    let fooUndefinedFlag
    const objA = memoizedFn('foo', fooUndefinedFlag)
    const objB = memoizedFn('foo')
    objA.should.equal(objB)
    callCount.should.equal(1)
  })

  it('should tolerate functions with default values', () => {
    let callCount = 0
    const fn = (a, b = 123) => {
      callCount++
      return { foo: a + b }
    }
    const memoizedFn = memoize(fn)
    const objA = memoizedFn(12)
    const objB = memoizedFn(12, 123)
    objA.foo.should.equal(objB.foo)
    objA.should.not.equal(objB)
    callCount.should.equal(2)
  })
})
