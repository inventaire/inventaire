const CONFIG = require('config')
const __ = CONFIG.universalPath

require('should')
const memoize = __.require('lib', 'utils/memoize')

describe('memoize', () => {
  it('should be a function', done => {
    memoize.should.be.a.Function()
    done()
  })

  it('should cache values per key', done => {
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
    done()
  })

  it('should not mix values', done => {
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
    done()
  })

  it('should accept multiple keys', done => {
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
    done()
  })

  it('should tolerate undefined keys', done => {
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
    done()
  })
})
