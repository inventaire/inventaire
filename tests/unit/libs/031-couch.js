import 'should'
import { joinOrderedIds } from '#lib/couch'

describe('couch utils', () => {
  describe('joinOrderedIds', () => {
    it('should return ordered id', () => {
      const id1 = joinOrderedIds('azerty', 'qwerty')
      id1.should.equal('azerty:qwerty')
      const id2 = joinOrderedIds('qwerty', 'azerty')
      id2.should.equal('azerty:qwerty')
      const id3 = joinOrderedIds('qwerty', '15hello')
      id3.should.equal('15hello:qwerty')
    })
  })
})
