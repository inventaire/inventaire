import 'should'
import { wait } from 'lib/promises'
import temporarilyMemoize from 'lib/temporarily_memoize'
const ttlAfterFunctionCallReturned = 200

describe('temporarily memoize', () => {
  it('should memoize calls with the same argument', async () => {
    const fn = async () => Math.random()
    const memoizedFn = temporarilyMemoize({ fn, ttlAfterFunctionCallReturned })
    const promiseA = memoizedFn('foo')
    const promiseB = memoizedFn('foo')
    promiseA.should.be.a.Promise()
    promiseB.should.be.a.Promise()
    ;(await promiseA).should.equal(await promiseB)
  })

  it('should not mixup calls', async () => {
    const fn = async arg => arg.toUpperCase()
    const memoizedFn = temporarilyMemoize({ fn, ttlAfterFunctionCallReturned })
    const promiseA = memoizedFn('a')
    const promiseB = memoizedFn('b')
    ;(await promiseA).should.equal('A')
    ;(await promiseB).should.equal('B')
  })

  it('should clear the cache after a delay', async () => {
    const fn = async () => Math.random()
    const memoizedFn = temporarilyMemoize({ fn, ttlAfterFunctionCallReturned })
    const [ a, b ] = await Promise.all([
      memoizedFn('foo'),
      memoizedFn('foo'),
    ])
    const cPromise = memoizedFn('foo')
    await wait(ttlAfterFunctionCallReturned + 10)
    const dPromise = memoizedFn('foo')
    a.should.equal(b)
    a.should.equal(await cPromise)
    a.should.not.equal(await dPromise)
  })

  it('should clear the cache after a failed call', async () => {
    let count = 0
    const throwOnOddCalls = async () => {
      count++
      if (count % 2 === 0) return 'yep'
      else throw new Error('failed')
    }
    const memoizedFn = temporarilyMemoize({ fn: throwOnOddCalls, ttlAfterFunctionCallReturned })
    const failPromiseA = memoizedFn('foo').catch(catchAndReturnErr)
    const failPromiseB = memoizedFn('foo').catch(catchAndReturnErr)
    const errA = await failPromiseA
    const errB = await failPromiseB
    errA.should.equal(errB)
    await wait(ttlAfterFunctionCallReturned + 10)
    const successRes = await memoizedFn('foo')
    successRes.should.equal('yep')
  })
})

const catchAndReturnErr = err => err
