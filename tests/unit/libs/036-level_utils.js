const __ = require('config').universalPath
require('should')
const getSubDb = __.require('level', 'get_sub_db')
const { reset, streamPromise, formatBatchOps } = __.require('level', 'utils')

describe('level utils', () => {
  describe('streamPromise', () => {
    it('should convert a stream in promise', async () => {
      const db = getSubDb('test:streamPromise')
      await db.batch([
        { type: 'put', key: 'a', value: 'b' },
        { type: 'put', key: 'c', value: 'd' }
      ])
      const stream = db.createReadStream()
      const results = await streamPromise(stream)
      results.should.deepEqual([
        { key: 'a', value: 'b' },
        { key: 'c', value: 'd' }
      ])
    })
  })

  describe('reset', () => {
    it('should reset a db', async () => {
      const db = getSubDb('test:reset')
      await db.put('a', 123)
      await reset(db)
      const results = await streamPromise(db.createReadStream())
      results.length.should.equal(0)
    })
  })

  describe('formatBatchOps', () => {
    it("should make operations default to 'put'", () => {
      formatBatchOps([
        { key: 'a', value: 'b' },
        { key: 'c', value: 'd' }
      ])
      .should.deepEqual([
        { type: 'put', key: 'a', value: 'b' },
        { type: 'put', key: 'c', value: 'd' }
      ])
    })

    it('should accept a single operation object', () => {
      formatBatchOps({ key: 'a', value: 'b' })
      .should.deepEqual([
        { key: 'a', value: 'b', type: 'put' }
      ])
    })
  })
})
