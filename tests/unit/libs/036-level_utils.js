require('should')
const { formatBatchOps } = require('db/level/utils')

describe('level utils', () => {
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
