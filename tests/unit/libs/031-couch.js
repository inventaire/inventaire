const CONFIG = require('config')
const __ = CONFIG.universalPath

require('should')

const couch_ = require('lib/couch')

describe('couch_', () => {
  it('env', () => {
    couch_.should.be.an.Object()
  })

  describe('joinOrderedIds', () => {
    it('should return ordered id', () => {
      const id1 = couch_.joinOrderedIds('azerty', 'qwerty')
      id1.should.equal('azerty:qwerty')
      const id2 = couch_.joinOrderedIds('qwerty', 'azerty')
      id2.should.equal('azerty:qwerty')
      const id3 = couch_.joinOrderedIds('qwerty', '15hello')
      id3.should.equal('15hello:qwerty')
    })
  })
})
